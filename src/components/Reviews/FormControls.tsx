import React, { useEffect, useRef, useState } from "react";
import DownArrorIcon from "../../assets/images/down-arror.png";

// Native <select> popups don't reliably open inside a Chrome extension side panel,
// so this mirrors the app's existing custom-dropdown pattern (.Dropdown/.DropdownItems,
// used elsewhere for the review action menu) instead of relying on the browser's own popup.
// Shared by ReviewForm and the reference-response form.
export function SelectDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((item) => item.value === value);

  return (
    <div className="flex flex-col gap-[6px] min-w-0">
      <label className="text-[11px] font-medium uppercase tracking-wide text-BlackColor-60">
        {label}
      </label>
      <div className="DropDownMain" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`bg-TextareaBg rounded-[5px] py-[10px] px-[15px] w-full min-w-0 max-w-full flex items-center justify-between gap-2 text-left text-base font-light border duration-200 ${
            open
              ? "border-LinkedInBlue"
              : "border-transparent hover:border-BorderColor-15"
          }`}
        >
          <span className="truncate text-BlackColor">{selected ? selected.label : "Select"}</span>
          <img
            src={DownArrorIcon}
            className={`h-[10px] w-[10px] shrink-0 duration-300 ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <ul className="Dropdown shadow-md !left-0 !right-auto !w-full !min-w-0 max-h-[220px] overflow-y-auto">
            {options.map((item) => (
              <li key={item.value} className="DropdownItems">
                <a
                  onClick={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <div className={item.value === value ? "text-LinkedInBlue font-medium" : ""}>
                    {item.label}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function CategoryStarRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-sm text-BlackColor flex-1">{label}</span>
      <div className="flex items-center gap-[4px]">
        {Array.from({ length: 5 }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index + 1)}
            className="outline-none duration-150 hover:scale-110"
            aria-label={`${label}: ${index + 1} star`}
          >
            <svg width="20" height="20" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21.6772 4.62395L25.3976 13.4902C25.4877 13.7054 25.6347 13.8919 25.823 14.0296C26.0112 14.1673 26.2335 14.2511 26.4659 14.2718L35.9887 15.095C36.2414 15.1153 36.4824 15.2101 36.6812 15.3674C36.8799 15.5247 37.0276 15.7374 37.1054 15.9786C37.1833 16.2199 37.1878 16.4788 37.1185 16.7226C37.0491 16.9664 36.909 17.1842 36.7159 17.3484L29.4912 23.6505C29.3156 23.8048 29.1851 24.0037 29.1134 24.2262C29.0418 24.4487 29.0318 24.6864 29.0844 24.9141L31.2497 34.2897C31.3069 34.5346 31.2908 34.7909 31.2034 35.0266C31.116 35.2624 30.9611 35.4673 30.7581 35.6157C30.5551 35.764 30.3129 35.8494 30.0617 35.8611C29.8105 35.8728 29.5614 35.8103 29.3455 35.6814L21.1615 30.7166C20.9626 30.5957 20.7344 30.5317 20.5016 30.5317C20.2689 30.5317 20.0407 30.5957 19.8418 30.7166L11.6578 35.6814C11.4419 35.8103 11.1928 35.8728 10.9416 35.8611C10.6904 35.8494 10.4482 35.764 10.2452 35.6157C10.0421 35.4673 9.88727 35.2624 9.79986 35.0266C9.71244 34.7909 9.69634 34.5346 9.75356 34.2897L11.9189 24.9141C11.9715 24.6864 11.9615 24.4487 11.8898 24.2262C11.8182 24.0037 11.6877 23.8048 11.5121 23.6505L4.28743 17.3484C4.09428 17.1842 3.95416 16.9664 3.88482 16.7226C3.81547 16.4788 3.82 16.2199 3.89784 15.9786C3.97569 15.7374 4.12334 15.5247 4.32211 15.3674C4.52089 15.2101 4.76186 15.1153 5.01454 15.095L14.5374 14.2718C14.7698 14.2511 14.992 14.1673 15.1803 14.0296C15.3685 13.8919 15.5156 13.7054 15.6057 13.4902L19.3261 4.62395C19.4255 4.39472 19.5897 4.19954 19.7986 4.06244C20.0074 3.92534 20.2518 3.85229 20.5016 3.85229C20.7515 3.85229 20.9959 3.92534 21.2047 4.06244C21.4136 4.19954 21.5778 4.39472 21.6772 4.62395Z"
                stroke="#0A66C2"
                strokeWidth="2.50709"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={index < value ? "#0A66C2" : "none"}
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SectionTitle({ children, right = null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-[8px]">
        <span className="w-[3px] h-[14px] rounded-full bg-LinkedInBlue" />
        <span className="text-sm font-semibold text-BlackColor">{children}</span>
      </div>
      {right}
    </div>
  );
}
