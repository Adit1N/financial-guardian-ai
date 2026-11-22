import os, json, threading
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer

class ModelSession:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, model_dir: str = "api/model"):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_dir: str = "api/model"):
        if hasattr(self, "_loaded"):
            return
        self.model_dir = model_dir
        self.session = None
        self.tokenizer = None
        self.labels = None
        self._load()
        self._loaded = True

    def _load(self):
        onnx_file = os.path.join(self.model_dir, os.environ.get("MODEL_FILENAME", "financial_guardian.onnx"))
        providers = ["CPUExecutionProvider"]
        self.session = ort.InferenceSession(onnx_file, providers=providers)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_dir)
        with open(os.path.join(self.model_dir, "label_maps.json")) as f:
            self.labels = json.load(f)
        print(f"✅ Model loaded: {onnx_file}")

    def predict(self, text: str):
        enc = self.tokenizer(
            text,
            truncation=True,
            max_length=int(os.environ.get("MAX_SEQ_LENGTH", 256)),
            padding=True,
            return_tensors="np",
        )
        ort_inputs = {
            "input_ids": enc["input_ids"].astype(np.int64),
            "attention_mask": enc["attention_mask"].astype(np.int64),
        }
        scam_logits, txn_logits, tax_logits, intent_logits = self.session.run(None, ort_inputs)

        def softmax(x):
            e = np.exp(x - np.max(x))
            return e / e.sum()

        scam_probs = softmax(scam_logits[0])
        txn_probs = softmax(txn_logits[0])
        tax_probs = softmax(tax_logits[0])
        intent_probs = softmax(intent_logits[0])

        intent_idx = int(np.argmax(intent_probs))
        intent = self.labels["intent_labels"][intent_idx]

        result = {
            "intent": intent,
            "intent_confidence": float(intent_probs[intent_idx]),
        }

        if intent == "scam":
            top3 = np.argsort(scam_probs)[-3:][::-1]
            result["scam_predictions"] = [
                {"label": self.labels["scam_labels"][int(i)], "confidence": float(scam_probs[int(i)])}
                for i in top3
            ]
        elif intent == "transaction":
            top3 = np.argsort(txn_probs)[-3:][::-1]
            result["transaction_predictions"] = [
                {"label": self.labels["txn_labels"][int(i)], "confidence": float(txn_probs[int(i)])}
                for i in top3
            ]
            result["tax_deductible"] = bool(np.argmax(tax_probs))
            result["tax_confidence"] = float(np.max(tax_probs))

        return result

_model = None

def get_model() -> ModelSession:
    global _model
    if _model is None:
        _model = ModelSession()
    return _model