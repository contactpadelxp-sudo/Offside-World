"use client";

import { useState } from "react";
import { AsYouType, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlerteCercle } from "@/components/icons";

/** Pays proposés (Belgique par défaut, puis voisins/fréquents). */
const COUNTRIES: { code: CountryCode; name: string; flag: string; dial: string; example: string }[] = [
  { code: "BE", name: "Belgique", flag: "🇧🇪", dial: "+32", example: "0470 12 34 56" },
  { code: "FR", name: "France", flag: "🇫🇷", dial: "+33", example: "06 12 34 56 78" },
  { code: "NL", name: "Pays-Bas", flag: "🇳🇱", dial: "+31", example: "06 12345678" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", dial: "+352", example: "621 123 456" },
  { code: "DE", name: "Allemagne", flag: "🇩🇪", dial: "+49", example: "0151 23456789" },
  { code: "GB", name: "Royaume-Uni", flag: "🇬🇧", dial: "+44", example: "07400 123456" },
  { code: "ES", name: "Espagne", flag: "🇪🇸", dial: "+34", example: "612 34 56 78" },
  { code: "IT", name: "Italie", flag: "🇮🇹", dial: "+39", example: "312 345 6789" },
  { code: "CH", name: "Suisse", flag: "🇨🇭", dial: "+41", example: "078 123 45 67" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", dial: "+351", example: "912 345 678" },
];

/**
 * Champ téléphone international : sélecteur de pays (Belgique par défaut) qui
 * adapte le format et la validation. Remonte la valeur en E.164 + un booléen de validité.
 */
export function PhoneField({
  onChange,
  label = "Téléphone",
}: {
  onChange: (value: string, isValid: boolean) => void;
  label?: string;
}) {
  const [country, setCountry] = useState<CountryCode>("BE");
  const [raw, setRaw] = useState("");
  const [touched, setTouched] = useState(false);

  const current = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  const validity = (value: string, c: CountryCode) => {
    if (!value.trim()) return false;
    try {
      return isValidPhoneNumber(value, c);
    } catch {
      return false;
    }
  };

  const emit = (value: string, c: CountryCode) => {
    // Valeur normalisée E.164 quand c'est valide, sinon la saisie brute
    let out = value;
    try {
      const t = new AsYouType(c);
      t.input(value);
      const number = t.getNumber();
      if (number) out = number.number; // format E.164 (+32...)
    } catch {
      /* garde la saisie brute */
    }
    onChange(out, validity(value, c));
  };

  const handleRaw = (v: string) => {
    const formatted = new AsYouType(country).input(v);
    setRaw(formatted);
    emit(formatted, country);
  };

  const handleCountry = (c: CountryCode) => {
    setCountry(c);
    emit(raw, c);
  };

  const showError = touched && raw.trim().length > 0 && !validity(raw, country);

  return (
    <div>
      <Label htmlFor="phone-input">{label}</Label>
      <div className="mt-1 flex gap-2">
        <select
          aria-label="Indicatif pays"
          value={country}
          onChange={(e) => handleCountry(e.target.value as CountryCode)}
          className="h-9 shrink-0 rounded-lg border border-input bg-input/30 px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.dial}
            </option>
          ))}
        </select>
        <Input
          id="phone-input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={raw}
          onChange={(e) => handleRaw(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={current.example}
          className={showError ? "border-destructive" : ""}
        />
      </div>
      {showError && (
        <p className="mt-1 text-sm text-destructive flex items-center gap-1">
          <AlerteCercle className="size-3.5" /> Numéro {current.name.toLowerCase()} invalide. Ex. : {current.example}
        </p>
      )}
    </div>
  );
}
