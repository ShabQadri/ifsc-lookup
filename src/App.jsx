import React, { useEffect, useState, useRef } from "react";
import Select, { components } from "react-select";
import "bootstrap/dist/css/bootstrap.min.css";

// Cloudflare Worker proxy URL
const API_BASE = "https://ifsc-proxy.ifsc-proxy.workers.dev/api";

// Detect mobile device
const isMobile = typeof navigator !== "undefined" &&
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Custom MenuList for Bank Dropdown
const BankMenuList = (props) => (
  <>
    <div style={{
      padding: "8px 12px",
      fontWeight: 600,
      background: "#f1f5f9",
      borderBottom: "1px solid #e5e7eb",
      color: "#222"
    }}>
      Search Bank
    </div>
    <components.MenuList {...props}>
      {props.children}
    </components.MenuList>
  </>
);

// Custom Control to handle mobile search focus
const CustomControl = (props) => {
  const inputRef = useRef(null);

  // Only on mobile: open menu without focusing input, focus only on tap/click in control
  useEffect(() => {
    if (isMobile && props.menuIsOpen && props.isFocused && !props.selectProps.mobileInputManuallyFocused) {
      // Remove focus from input when menu opens
      if (inputRef.current) inputRef.current.blur();
    }
  }, [props.menuIsOpen, props.isFocused, props.selectProps.mobileInputManuallyFocused]);

  return (
    <components.Control
      {...props}
      innerProps={{
        ...props.innerProps,
        onMouseDown: (e) => {
          if (isMobile && !props.selectProps.mobileInputManuallyFocused) {
            // Open menu without focusing input
            props.selectProps.setMobileInputManuallyFocused(false);
          }
          if (props.innerProps.onMouseDown) props.innerProps.onMouseDown(e);
        },
        onClick: (e) => {
          if (isMobile && !props.selectProps.mobileInputManuallyFocused) {
            props.selectProps.setMobileInputManuallyFocused(false);
          }
          if (props.innerProps.onClick) props.innerProps.onClick(e);
        }
      }}
    >
      {props.children}
      {/* Invisible input to handle focus */}
      {isMobile && (
        <input
          ref={inputRef}
          style={{
            position: "absolute",
            left: "-9999px",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none"
          }}
          readOnly
          tabIndex={-1}
        />
      )}
    </components.Control>
  );
};

function App() {
  // Dropdown state for mobile search focus
  const [mobileInputManuallyFocused, setMobileInputManuallyFocused] = useState(false);

  const [banks, setBanks] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedBank, setSelectedBank] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  const [ifscInput, setIfscInput] = useState("");
  const [searchMode, setSearchMode] = useState("dropdown");
  const [ifscDetails, setIfscDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/banks`)
      .then((res) => res.json())
      .then((data) => setBanks(data.map((b) => ({ label: b, value: b }))))
      .catch(() => setBanks([]));
  }, []);

  useEffect(() => {
    setStates([]);
    setSelectedState(null);
    setDistricts([]);
    setSelectedDistrict(null);
    setBranches([]);
    setSelectedBranch(null);

    if (selectedBank) {
      fetch(
        `${API_BASE}/states?bank=${encodeURIComponent(selectedBank.value)}`
      )
        .then((res) => res.json())
        .then((data) =>
          setStates(data.map((s) => ({ label: s, value: s })))
        )
        .catch(() => setStates([]));
    }
  }, [selectedBank]);

  useEffect(() => {
    setDistricts([]);
    setSelectedDistrict(null);
    setBranches([]);
    setSelectedBranch(null);

    if (selectedBank && selectedState) {
      fetch(
        `${API_BASE}/cities?bank=${encodeURIComponent(
          selectedBank.value
        )}&state=${encodeURIComponent(selectedState.value)}`
      )
        .then((res) => res.json())
        .then((data) =>
          setDistricts(data.map((d) => ({ label: d, value: d })))
        )
        .catch(() => setDistricts([]));
    }
  }, [selectedState, selectedBank]);

  useEffect(() => {
    setBranches([]);
    setSelectedBranch(null);

    if (selectedBank && selectedState && selectedDistrict) {
      fetch(
        `${API_BASE}/branches?bank=${encodeURIComponent(
          selectedBank.value
        )}&state=${encodeURIComponent(
          selectedState.value
        )}&city=${encodeURIComponent(selectedDistrict.value)}`
      )
        .then((res) => res.json())
        .then((data) =>
          setBranches(
            data.map((b) => ({
              label: b.BRANCH,
              value: b.IFSC,
            }))
          )
        )
        .catch(() => setBranches([]));
    }
  }, [selectedDistrict, selectedBank, selectedState]);

  // Search by IFSC code input
  const handleIfscSearch = async (e) => {
    e.preventDefault();
    if (!ifscInput.trim()) return;
    setLoading(true);
    setIfscDetails(null);
    setSelectedBank(null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBranch(null);
    try {
      const res = await fetch(`${API_BASE}/ifsc/${encodeURIComponent(ifscInput.trim())}`);
      const data = await res.json();
      setIfscDetails(data);
    } catch (err) {
      setIfscDetails({ error: "No details found or network error." });
    }
    setLoading(false);
    setCopied(false);
  };

  // Search by dropdowns
  const handleDropdownSearch = async (e) => {
    e.preventDefault();
    if (
      selectedBank &&
      selectedState &&
      selectedDistrict &&
      selectedBranch
    ) {
      setLoading(true);
      setIfscDetails(null);
      setIfscInput("");
      try {
        const res = await fetch(
          `${API_BASE}/ifsc/${encodeURIComponent(selectedBranch.value)}`
        );
        const data = await res.json();
        setIfscDetails(data);
      } catch (err) {
        setIfscDetails({ error: "No details found or network error." });
      }
      setLoading(false);
      setCopied(false);
    }
  };

  const handleReset = () => {
    setSelectedBank(null);
    setSelectedState(null);
    setSelectedDistrict(null);
    setSelectedBranch(null);
    setStates([]);
    setDistricts([]);
    setBranches([]);
    setIfscDetails(null);
    setCopied(false);
    setIfscInput("");
  };

  const handleCopy = () => {
    if (ifscDetails?.IFSC) {
      navigator.clipboard.writeText(ifscDetails.IFSC);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const InfoRow = ({ icon, label, value }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "7px 0",
        fontSize: 15,
        fontWeight: 500,
        color: "#2a2a2a",
        gap: 10,
        lineHeight: 1.5,
        minWidth: 0,
      }}
    >
      <span style={{ width: 28, fontSize: 18, opacity: 0.7, marginTop: 2, flexShrink: 0 }}>
        {icon}
      </span>
      <span
        style={{
          minWidth: 70,
          color: "#6b7280",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          flex: 1,
          wordBreak: "break-word",
          whiteSpace: "pre-line",
          minWidth: 0,
          overflowWrap: "break-word",
        }}
      >
        {value || <span style={{ color: "#aaa" }}>-</span>}
      </span>
    </div>
  );

  const AddressRow = ({ icon, label, value }) => (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "11px 0 5px 0",
        fontSize: 16,
        fontWeight: 500,
        color: "#2a2a2a",
        gap: 10,
        lineHeight: 1.5,
        minWidth: 0,
        borderTop: "1px solid #f0f4fa",
        marginTop: 10
      }}
    >
      <span style={{ width: 28, fontSize: 18, opacity: 0.7, marginTop: 2, flexShrink: 0 }}>
        {icon}
      </span>
      <span
        style={{
          minWidth: 70,
          color: "#6b7280",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          flex: 1,
          wordBreak: "break-word",
          whiteSpace: "pre-line",
          minWidth: 0,
          overflowWrap: "break-word",
        }}
      >
        {value || <span style={{ color: "#aaa" }}>-</span>}
      </span>
    </div>
  );

  function OutputDetails({ details }) {
    const left = [
      { icon: "🏦", label: "Bank", value: details.BANK },
      { icon: "📍", label: "District", value: details.DISTRICT || details.CITY },
      { icon: "🗺️", label: "State", value: details.STATE },
      { icon: "☎️", label: "Contact", value: details.CONTACT },
      { icon: "💸", label: "NEFT", value: details.NEFT },
      { icon: "💳", label: "RTGS", value: details.RTGS },
    ];
    const right = [
      { icon: "🏢", label: "Branch", value: details.BRANCH },
      { icon: "🌆", label: "City", value: details.CITY },
      { icon: "🏷️", label: "MICR", value: details.MICR },
      { icon: "⚡", label: "IMPS", value: details.IMPS },
      { icon: "📱", label: "UPI", value: details.UPI },
      { icon: "🌐", label: "SWIFT", value: details.SWIFT }
    ];

    while (left.length < right.length) left.push({ icon: "", label: "", value: "" });
    while (right.length < left.length) right.push({ icon: "", label: "", value: "" });

    return (
      <div className="ifsc-details-card">
        <div className="ifsc-details-cols">
          <div className="ifsc-details-col">{left.map((row, i) => <InfoRow key={row.label + i} {...row} />)}</div>
          <div className="ifsc-details-col">{right.map((row, i) => <InfoRow key={row.label + i} {...row} />)}</div>
        </div>
        <div className="ifsc-details-row-full">
          <AddressRow icon="📬" label="Address" value={details.ADDRESS} />
        </div>
      </div>
    );
  }

  // --- JSX ---
  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)" }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 12px" }}>
        <div className="text-center mb-4">
          {/* Indian Bank SVG with Rupee Symbol */}
          <span style={{ display: "inline-block", marginBottom: 10 }}>
            <svg width="50" height="50" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#f0f4fa" />
              {/* Bank building */}
              <rect x="12" y="22" width="24" height="14" rx="2" fill="#1976d2" />
              <rect x="18" y="28" width="4" height="8" fill="#fff" />
              <rect x="26" y="28" width="4" height="8" fill="#fff" />
              {/* Roof */}
              <polygon points="24,12 10,22 38,22" fill="#338fbd" />
              {/* Rupee symbol */}
              <text x="24" y="32" textAnchor="middle" fontWeight="bold" fontSize="15" fill="#fff" fontFamily="Arial, sans-serif">₹</text>
            </svg>
          </span>
          <h2 className="fw-bold">IFSC Code Lookup</h2>
          <div className="text-secondary" style={{ maxWidth: 400, margin: "0 auto" }}>
            Find Indian Financial System Codes for banks across India. Search by bank, state, district, branch, or IFSC code.
          </div>
        </div>

        {/* --- TABS FOR SEARCH MODE --- */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28, gap: 8 }}>
          <button
            type="button"
            className={searchMode === "dropdown" ? "btn btn-primary" : "btn btn-outline-primary"}
            style={{ fontWeight: 600, borderRadius: "0.375rem", minWidth: 130 }}
            onClick={() => setSearchMode("dropdown")}
          >
            Search by Location
          </button>
          <button
            type="button"
            className={searchMode === "ifsc" ? "btn btn-primary" : "btn btn-outline-primary"}
            style={{ fontWeight: 600, borderRadius: "0.375rem", minWidth: 130 }}
            onClick={() => setSearchMode("ifsc")}
          >
            Search by IFSC
          </button>
        </div>

        {/* --- IFSC SEARCH BOX --- */}
        {searchMode === "ifsc" && (
          <form onSubmit={handleIfscSearch} style={{ marginBottom: 30, display: "flex", gap: 12, alignItems: "center", maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            <input
              className="form-control"
              style={{ fontWeight: 500 }}
              type="text"
              placeholder="Enter IFSC code"
              value={ifscInput}
              onChange={e => setIfscInput(e.target.value.toUpperCase())}
              maxLength={20}
            />
            <button
              type="submit"
              style={{
                background: "#338fbd",
                color: "#fff",
                border: "none",
                borderRadius: "0.375rem",
                fontWeight: 500,
                padding: "0.375rem 1.25rem",
                boxShadow: "0 2px 8px #e3f2fd80"
              }}
              disabled={!ifscInput.trim() || loading}
            >
              Search
            </button>
          </form>
        )}

        {/* --- DROPDOWN SEARCH FORM --- */}
        {searchMode === "dropdown" && (
          <form
            className="bg-white p-4 rounded shadow"
            style={{ minWidth: 350, maxWidth: 600, width: "100%", margin: "0 auto" }}
            onSubmit={handleDropdownSearch}
          >
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label>Bank Name</label>
                <Select
                  options={banks}
                  value={selectedBank}
                  onChange={setSelectedBank}
                  placeholder="Type to search..."
                  isSearchable
                  components={{ MenuList: BankMenuList, Control: CustomControl }}
                  menuPlacement="auto"
                  styles={{
                    menu: (provided) => ({
                      ...provided,
                      zIndex: 1000,
                    }),
                    input: (provided) => ({
                      ...provided,
                      fontWeight: 500,
                    }),
                  }}
                  mobileInputManuallyFocused={mobileInputManuallyFocused}
                  setMobileInputManuallyFocused={setMobileInputManuallyFocused}
                />
              </div>
              <div className="col-md-6">
                <label>State</label>
                <Select
                  options={states}
                  value={selectedState}
                  onChange={setSelectedState}
                  placeholder="Select State"
                  isSearchable
                  isDisabled={!selectedBank}
                  components={{ Control: CustomControl }}
                  mobileInputManuallyFocused={mobileInputManuallyFocused}
                  setMobileInputManuallyFocused={setMobileInputManuallyFocused}
                />
              </div>
              <div className="col-md-6">
                <label>District</label>
                <Select
                  options={districts}
                  value={selectedDistrict}
                  onChange={setSelectedDistrict}
                  placeholder="Select District"
                  isSearchable
                  isDisabled={!selectedState}
                  components={{ Control: CustomControl }}
                  mobileInputManuallyFocused={mobileInputManuallyFocused}
                  setMobileInputManuallyFocused={setMobileInputManuallyFocused}
                />
              </div>
              <div className="col-md-6">
                <label>Branch</label>
                <Select
                  options={branches}
                  value={selectedBranch}
                  onChange={setSelectedBranch}
                  placeholder="Select Branch"
                  isSearchable
                  isDisabled={!selectedDistrict}
                  components={{ Control: CustomControl }}
                  mobileInputManuallyFocused={mobileInputManuallyFocused}
                  setMobileInputManuallyFocused={setMobileInputManuallyFocused}
                />
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="flex-fill"
                type="submit"
                disabled={
                  !selectedBank ||
                  !selectedState ||
                  !selectedDistrict ||
                  !selectedBranch ||
                  loading
                }
                style={{
                  backgroundColor: "#338fbd",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontWeight: 500,
                  transition: "background 0.2s",
                  padding: "0.375rem 0.75rem",
                  boxShadow: "0 2px 8px #e3f2fd80"
                }}
              >
                {loading ? "Searching..." : "🔍 Find IFSC Code"}
              </button>
              <button
                type="button"
                className="flex-fill"
                style={{
                  backgroundColor: "#219575",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.375rem",
                  fontWeight: 500,
                  transition: "background 0.2s",
                  padding: "0.375rem 0.75rem",
                }}
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        )}

        {/* --- OUTPUT CARD --- */}
        {ifscDetails && (
          <div
            className="mt-4 rounded shadow"
            style={{
              width: "100%",
              maxWidth: 600,
              background: "#f9fbfe",
              border: "1.5px solid #e3eefa",
              padding: "28px 18px",
              margin: "32px auto 0 auto",
              position: "relative",
              boxSizing: "border-box",
              overflow: "hidden"
            }}
          >
            {ifscDetails.error ? (
              <div className="text-danger">{ifscDetails.error}</div>
            ) : (
              <>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: "wrap"
                }}>
                  <span style={{
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 2,
                    color: "#1976d2",
                    background: "#e3f2fd",
                    borderRadius: 8,
                    padding: "7px 18px",
                    border: "1px solid #b6e0fa",
                    wordBreak: "break-all"
                  }}>
                    {ifscDetails.IFSC}
                  </span>
                  <button type="button" onClick={handleCopy} style={{
                    background: copied ? "#a5f3c7" : "#e0eefa",
                    color: "#1976d2",
                    border: "none",
                    padding: "7px 18px",
                    fontWeight: 700,
                    borderRadius: 8,
                    fontSize: 15,
                    marginLeft: 3,
                    cursor: "pointer",
                    transition: "background 0.15s"
                  }}>
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <OutputDetails details={ifscDetails} />
              </>
            )}
          </div>
        )}

        <style>{`
          .ifsc-details-card {
            width: 100%;
            background: #ffffffd9;
            border-radius: 10px;
            box-shadow: 0 1px 8px #e0eefa40;
            padding: 10px 10px;
            box-sizing: border-box;
          }
          .ifsc-details-cols {
            display: flex;
            flex-direction: row;
            gap: 28px;
          }
          .ifsc-details-col {
            flex: 1 1 0;
            min-width: 0;
          }
          .ifsc-details-row-full {
            grid-column: 1 / -1;
            margin-top: 0;
            margin-bottom: 0;
          }
          @media (max-width: 700px) {
            .ifsc-details-cols {
              flex-direction: column;
              gap: 0;
            }
            .ifsc-details-card {
              padding: 5px 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

export default App;
