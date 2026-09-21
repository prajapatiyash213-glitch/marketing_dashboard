import { useRef, useState } from "react";

export function Dropzone({ onFiles, busy, large = false }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Add spreadsheet files"
      aria-busy={busy}
      onClick={openPicker}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker(); } }}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer?.files); }}
      className={`flex cursor-pointer flex-col items-center justify-center border px-6 text-center ${
        over ? "border-solid border-accent bg-accentSoft" : "border-dashed border-hairline bg-panel"
      }`}
      style={{ minHeight: large ? 260 : 150 }}
    >
      <p className="font-display" style={{ fontSize: large ? 22 : 17 }}>
        {busy ? "Reading your files…" : "Drop your lead and SEO workbooks here"}
      </p>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Several at once is fine. Columns are matched by their contents, so headers don&apos;t have to line up
        between files.
      </p>
      <p className="mt-3 text-xs text-faint">.xlsx · .xlsm · .xls · .csv — parsed in this browser, never uploaded</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xlsm,.xls,.csv"
        className="hidden"
        onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
