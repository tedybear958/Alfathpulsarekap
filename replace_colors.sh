#!/bin/bash

# Define the pairs of hardcoded blue classes to brand classes
declare -A colors
colors["blue-50"]="brand-50"
colors["blue-100"]="brand-100"
colors["blue-200"]="brand-200"
colors["blue-400"]="brand-400"
colors["blue-500"]="brand-500"
colors["blue-600"]="brand-600"
colors["blue-700"]="brand-700"
colors["blue-800"]="brand-800"
colors["blue-900"]="brand-900"

# List of files to process (extracted from grep results)
files=(
  "src/components/Savings.tsx"
  "src/components/ConfirmModal.tsx"
  "src/components/Login.tsx"
  "src/components/Deposits.tsx"
  "src/components/Team.tsx"
  "src/components/VoucherRecaps.tsx"
  "src/components/Dashboard.tsx"
  "src/components/DepositAnalytics.tsx"
  "src/components/Debts.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    for blue in "${!colors[@]}"; do
      brand=${colors[$blue]}
      # Use sed to replace the blue classes. 
      # We use boundary checks to avoid accidental partial matches.
      sed -i "s/\b$blue\b/$brand/g" "$file"
    done
  fi
done

echo "Color replacement complete."
