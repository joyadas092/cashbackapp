"use client";

import { useMemo, useState } from "react";
import { calculateDistribution, validateCommissionRule } from "@/lib/commission/engine";
import { Input } from "@/components/ui/Input";
import { formatInr } from "@/lib/utils";

export interface CashbackRuleValue {
  customerPct: number;
  profitLinkPct: number;
  referralPct: number;
  platformPct: number;
  fixedAmount: number | null;
  maxCashback: number | null;
  minOrderValue: number | null;
  validityDays: number | null;
  isActive: boolean;
}

export const DEFAULT_RULE: CashbackRuleValue = {
  customerPct: 60,
  profitLinkPct: 15,
  referralPct: 5,
  platformPct: 20,
  fixedAmount: null,
  maxCashback: null,
  minOrderValue: null,
  validityDays: null,
  isActive: true,
};

function numberField(label: string, value: number, onChange: (v: number) => void) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      <Input
        type="number"
        value={value}
        min={0}
        max={100}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function nullableNumberField(
  label: string,
  value: number | null,
  onChange: (v: number | null) => void
) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      <Input
        type="number"
        value={value ?? ""}
        min={0}
        placeholder="No limit"
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </label>
  );
}

export function CashbackRuleEditor({
  value,
  onChange,
}: {
  value: CashbackRuleValue;
  onChange: (v: CashbackRuleValue) => void;
}) {
  const [sampleCommission, setSampleCommission] = useState(1000);

  const validationError = useMemo(() => {
    try {
      validateCommissionRule(value);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Invalid rule";
    }
  }, [value]);

  const preview = useMemo(() => {
    if (validationError) return null;
    try {
      return calculateDistribution({ commissionAmount: sampleCommission, rule: value });
    } catch {
      return null;
    }
  }, [value, sampleCommission, validationError]);

  function set<K extends keyof CashbackRuleValue>(key: K, v: CashbackRuleValue[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="rounded-xl2 border border-slate-200 bg-navy-900/60 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {numberField("Customer %", value.customerPct, (v) => set("customerPct", v))}
        {numberField("Profit Link %", value.profitLinkPct, (v) => set("profitLinkPct", v))}
        {numberField("Referral %", value.referralPct, (v) => set("referralPct", v))}
        {numberField("Platform %", value.platformPct, (v) => set("platformPct", v))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {nullableNumberField("Fixed Amount (₹)", value.fixedAmount, (v) => set("fixedAmount", v))}
        {nullableNumberField("Max Cashback (₹)", value.maxCashback, (v) => set("maxCashback", v))}
        {nullableNumberField("Min Order Value (₹)", value.minOrderValue, (v) => set("minOrderValue", v))}
        {nullableNumberField("Validity (days)", value.validityDays, (v) => set("validityDays", v))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={value.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        Active
      </label>

      {validationError && <p className="mt-3 text-sm text-red-600">{validationError}</p>}

      <div className="mt-4 border-t border-slate-200 pt-4">
        <label className="flex max-w-xs flex-col gap-1 text-xs text-slate-600">
          Sample Cuelinks commission (₹)
          <Input
            type="number"
            value={sampleCommission}
            min={0}
            onChange={(e) => setSampleCommission(Number(e.target.value))}
          />
        </label>
        {preview && (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-xs text-slate-500">Customer</div>
              <div className="font-semibold text-cashlime-700">{formatInr(preview.customer)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Profit Link</div>
              <div className="font-semibold text-cyan-300">{formatInr(preview.profitLink)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Referral</div>
              <div className="font-semibold text-violet-700">{formatInr(preview.referral)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Platform</div>
              <div className="font-semibold text-slate-700">{formatInr(preview.platform)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
