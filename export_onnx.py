# export_onnx.py
import os
import json
import torch
import torch.nn as nn
import numpy as np
from transformers import AutoTokenizer,DistilBertModel
from pathlib import Path

# ----------------------------------------------------------------------
# 1️⃣  Load label maps (scam, txn, intent labels)
# ----------------------------------------------------------------------
with open(os.path.join("api", "model", "label_maps.json")) as f:
    LABELS = json.load(f)

SCAM_LABELS = LABELS["scam_labels"]
TXN_LABELS  = LABELS["txn_labels"]
INTENT_LABELS = LABELS["intent_labels"]

# ----------------------------------------------------------------------
# 2️⃣  Define the model architecture (same as training)
# ----------------------------------------------------------------------
class MultiTask(nn.Module):
    def __init__(self):
        super().__init__()
        from transformers import DistilBertModel
        self.encoder = DistilBertModel.from_pretrained('distilbert-base-uncased')
        hidden = self.encoder.config.hidden_size
        self.scam_head   = nn.Linear(hidden, len(SCAM_LABELS))
        self.txn_head    = nn.Linear(hidden, len(TXN_LABELS))
        self.tax_head    = nn.Linear(hidden, 2)          # 0 = no, 1 = yes
        self.intent_head = nn.Linear(hidden, len(INTENT_LABELS))

    def forward(self, input_ids, attention_mask):
        # DistilBert returns a tuple: (last_hidden_state, pooler_output, ...).
        # We use the first element (the pooled representation of the CLS token)
        h = self.encoder(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state[:, 0]
        h = nn.functional.dropout(h, p=0.1)  # optional dropout for safety
        scam_logits   = self.scam_head(h)
        txn_logits    = self.txn_head(h)
        tax_logits    = self.tax_head(h)
        intent_logits = self.intent_head(h)
        return scam_logits, txn_logits, tax_logits, intent_logits

# ----------------------------------------------------------------------
# 2️⃣  Load the PyTorch checkpoint (model.pt) and export to ONNX
# ----------------------------------------------------------------------
model_dir = Path("api/model")               # <-- this is where model.pt lives
model_path = os.path.join(model_dir, "model.pt")
dummy_ids   = torch.randint(0, 30000, (1, 256), dtype=torch.long)   # batch=1, max_len=256
dummy_mask  = torch.ones(1, 256, dtype=torch.long)

model = MultiTask()
state_dict = torch.load(os.path.join(model_dir, "model.pt"), map_location="cpu")
model.load_state_dict(state_dict)
model.eval()

dummy_ids = torch.randint(0, 30000, (1, 256), dtype=torch.long)
dummy_mask = torch.ones(1, 256, dtype=torch.long)

torch.onnx.export(
    model,
    (dummy_ids, dummy_mask),
    os.path.join(model_dir, "financial_guardian.onnx"),
    input_names=["input_ids", "attention_mask"],
    output_names=["scam_logits", "txn_logits", "tax_logits", "intent_logits"],
    dynamic_axes={
        "input_ids": {0: "batch", 1: "sequence"},
        "attention_mask": {0: "batch", 1: "sequence"},
        "scam_logits": {0: "batch"},
        "txn_logits": {0: "batch"},
        "tax_logits": {0: "batch"},
        "intent_logits": {0: "batch"},
    },
    opset_version=17,
    do_constant_folding=True,
)

print(f"✅ Exported financial_guardian.onnx to {model_dir}")

# ----------------------------------------------------------------------
# 2️⃣  Verify the export (optional but recommended)
# ----------------------------------------------------------------------
import onnxruntime as ort
from transformers import AutoTokenizer

# Load tokenizer (same as in training)
tokenizer = AutoTokenizer.from_pretrained(os.path.join("api", "model", "tokenizer"))

def softmax(x):
    e = np.exp(x - np.max(x))
    return e / e.sum()

def predict(text: str):
    enc = tokenizer(
        text,
        truncation=True,
        max_length=256,
        padding=True,
        return_tensors="np",
    )
    enc_ids = enc["input_ids"].astype(np.int64)
    enc_mask  = enc["attention_mask"].astype(np.int64)

    sess = ort.InferenceSession(os.path.join("api", "model", "financial_guardian.onnx"))
    ort_inputs = {
        "input_ids": enc["input_ids"].astype(np.int64),
        "attention_mask": enc["attention_mask"].astype(np.int64),
    }
    out = sess.run(None, ort_inputs)   # returns a list of 4 arrays
    scam_logits, txn_logits, tax_logits, intent_logits = out

    scam_probs = np.exp(scores := np.exp(scam_logits[0] - np.max(scam_logits[0])))
    scam_probs /= scam_probs.sum()

    txn_probs = np.exp(txn_logits[0] - np.max(txn_logits[0]))
    txn_probs /= txn_probs.sum()

    tax_probs   = np.exp(tax_logits[0] - np.max(tax_logits[0]))
    intent_probs = np.exp(intent_logits[0] - np.max(intent_logits[0]))

    intent_idx = int(np.argmax(intent_probs))
    intent = LABELS["intent_labels"][intent_idx]
    intent_conf = float(intent_probs[intent_idx])

    result = {"intent": intent, "intent_confidence": intent_conf}
    if intent == "scam":
        top3 = np.argsort(scam_probs)[-3:][::-1]
        result["scam_predictions"] = [
            {"label": LABELS["scam_labels"][i], "confidence": float(scam_probs[i])}
            for i in top3
        ]
    elif intent == "transaction":
        top3 = np.argsort(txn_probs)[-3:][::-1]
        result["transaction_predictions"] = [
            {"label": LABELS["txn_labels"][i], "confidence": float(p)} for i, p in zip(top3, txn_probs)
        ]
        result["tax_deductible"] = bool(np.argmax(tax_probs))
        result["tax_confidence"] = float(np.max(tax_probs))

    return result

# Test it
if __name__ == "__main__":
    test_sentences = [
        "IRS calling – pay $5000 in gift cards now or we will arrest you",
        "Home Depot $245.00 tools and materials for client project",
        "Can I deduct my home office expenses for my freelance work?",
        "Got a meeting at 3pm tomorrow to discuss the project",
    ]
    for s in test_sentences:
        print("\n>>>", s[:60] + "...")
        print("   →", predict(s))