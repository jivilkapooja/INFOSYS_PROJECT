import pandas as pd
import joblib

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

# ---------------- LOAD DATA ----------------
df = pd.read_csv("Loan_Eligibility_Data_4000_Dependents_0_2.csv")

# ---------------- HANDLE MISSING VALUES ----------------
df.ffill(inplace=True)

print("Dataset Columns:")
print(df.columns.tolist())

# ---------------- ENCODE CATEGORICAL COLUMNS ----------------
le = LabelEncoder()

categorical_cols = [
    "Gender",
    "Married",
    "Dependents",
    "Education",
    "Employment Type",
    "Property Area",
    "Loan Status (Target)"
]

for col in categorical_cols:
    df[col] = le.fit_transform(df[col])

# ---------------- FEATURES ----------------
X = df[
    [
        "Gender",
        "Married",
        "Dependents",
        "Education",
        "Employment Type",
        "Applicant Income",
        "Co-applicant Income",
        "Loan Amount",
        "Loan Amount Term",
        "Credit History",
        "Property Area"
    ]
]

# ---------------- TARGET ----------------
y = df["Loan Status (Target)"]

# ---------------- SPLIT ----------------
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------- MODEL ----------------
model = XGBClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=4,
    subsample=0.9,
    colsample_bytree=0.9,
    eval_metric="logloss",
    random_state=42
)

# ---------------- TRAIN ----------------
model.fit(X_train, y_train)

# ---------------- EVALUATE ----------------
preds = model.predict(X_test)
accuracy = accuracy_score(y_test, preds)

print(f"Model Accuracy: {accuracy * 100:.2f}%")

# ---------------- SAVE MODEL ----------------
joblib.dump(accuracy, "model_accuracy.pkl")
print("✅ Model accuracy saved")

