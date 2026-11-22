import json
from pathlib import Path
from functools import lru_cache
import torch
import torch.nn as nn
from transformers import DistilBertModel, DistilBertTokenizerFast


class FinancialGuardianMultiTask(nn.Module):
    def __init__(self, pretrained_name: str = "distilbert-base-uncased"):
        super().__init__()
        self.encoder = DistilBertModel.from_pretrained(pretrained_name)
        hidden_size = self.encoder.config.hidden_size  # 768
        self.scam_head = nn.Linear(hidden_size, 9)
        self.txn_head = nn.Linear(hidden_size, 18)
        self.tax_head = nn.Linear(hidden_size, 2)
        self.intent_head = nn.Linear(hidden_size, 4)

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor) -> dict[str, torch.Tensor]:
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        cls_emb = outputs.last_hidden_state[:, 0, :]
        return {
            "scam": self.scam_head(cls_emb),
            "txn": self.txn_head(cls_emb),
            "tax": self.tax_head(cls_emb),
            "intent": self.intent_head(cls_emb),
        }


class GuardianPredictor:
    def __init__(self, model_dir: str = "api/model", max_length: int = 256):
        self.model_dir = Path(model_dir)
        self.max_length = max_length
        self.device = torch.device("cpu")

        with open(self.model_dir / "label_maps.json", "r", encoding="utf-8") as f:
            self.label_maps = json.load(f)

        self.tokenizer = DistilBertTokenizerFast.from_pretrained(str(self.model_dir / "tokenizer"))
        self.model = FinancialGuardianMultiTask("distilbert-base-uncased")
        state_dict = torch.load(self.model_dir / "model.pt", map_location=self.device, weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()

    @torch.no_grad()
    def predict(self, text: str) -> dict:
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=self.max_length,
            padding=True,
        ).to(self.device)

        logits = self.model(inputs["input_ids"], inputs["attention_mask"])

        scam_probs = torch.softmax(logits["scam"], dim=-1)[0]
        txn_probs = torch.softmax(logits["txn"], dim=-1)[0]
        tax_probs = torch.softmax(logits["tax"], dim=-1)[0]
        intent_probs = torch.softmax(logits["intent"], dim=-1)[0]

        scam_idx = int(torch.argmax(scam_probs).item())
        txn_idx = int(torch.argmax(txn_probs).item())
        tax_idx = int(torch.argmax(tax_probs).item())
        intent_idx = int(torch.argmax(intent_probs).item())

        return {
            "intent": {
                "label": self.label_maps["intent_labels"][intent_idx],
                "confidence": round(float(intent_probs[intent_idx]), 4),
            },
            "scam": {
                "label": self.label_maps["scam_labels"][scam_idx],
                "confidence": round(float(scam_probs[scam_idx]), 4),
            },
            "transaction_category": {
                "label": self.label_maps["txn_labels"][txn_idx],
                "confidence": round(float(txn_probs[txn_idx]), 4),
            },
            "tax_deductible": {
                "is_deductible": bool(tax_idx == 1),
                "confidence": round(float(tax_probs[tax_idx]), 4),
            },
        }


@lru_cache(maxsize=1)
def get_predictor() -> GuardianPredictor:
    return GuardianPredictor()