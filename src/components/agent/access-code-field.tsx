import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { readAccessCode, saveAccessCode } from "@/lib/access-code";

/** Shown only when the deployment sets DEMO_ACCESS_CODE, to protect the Gemini quota. */
export function AccessCodeField({ es }: { es: boolean }) {
  const [code, setCode] = useState(() => readAccessCode() ?? "");
  return (
    <label className="flex max-w-md items-center gap-2 border-y border-dashed border-input py-2 text-sm">
      <KeyRound className="size-4 shrink-0 text-ink-violet" />
      <span className="shrink-0 font-semibold">{es ? "Código de la demo" : "Demo code"}</span>
      <Input
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          saveAccessCode(e.target.value);
        }}
        placeholder={es ? "Lo entregamos a los jurados" : "Shared with the judges"}
        className="h-9"
      />
    </label>
  );
}
