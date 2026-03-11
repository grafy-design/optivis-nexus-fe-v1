"use client";

import { useEffect, useMemo, useState } from "react";

interface TSISaveModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}

function formatLocalTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function TSISaveModal({ open, onClose, onSave }: TSISaveModalProps) {
  const [simulationName, setSimulationName] = useState("");
  const [simulationDescription, setSimulationDescription] = useState("");
  const currentDate = useMemo(() => formatLocalTimestamp(new Date()), [open]);

  useEffect(() => {
    if (!open) return;

    setSimulationName("");
    setSimulationDescription("");
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "relative",
          width: 480,
          borderRadius: 24,
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 36,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 24,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              background: "rgba(255,255,255,0.6)",
              mixBlendMode: "color-dodge",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              background: "rgba(255,255,255,0.88)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 24,
              background: "rgba(0,0,0,0.04)",
              mixBlendMode: "hard-light",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 17,
                color: "#484646",
                letterSpacing: "-0.51px",
                lineHeight: "17.85px",
                margin: 0,
              }}
            >
              Study Title
            </p>
            <input
              type="text"
              value={simulationName}
              onChange={(event) => setSimulationName(event.target.value)}
              placeholder="Write a title"
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 12,
                color: "#787776",
                letterSpacing: "-0.36px",
                lineHeight: "13.2px",
                background: "none",
                border: "none",
                outline: "none",
                padding: 0,
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 17,
                color: "#484646",
                letterSpacing: "-0.51px",
                lineHeight: "17.85px",
                margin: 0,
              }}
            >
              Date
            </p>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 12,
                color: "#787776",
                letterSpacing: "-0.36px",
                lineHeight: "13.2px",
                margin: 0,
              }}
            >
              {currentDate}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 17,
                color: "#484646",
                letterSpacing: "-0.51px",
                lineHeight: "17.85px",
                margin: 0,
              }}
            >
              Version
            </p>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 12,
                color: "#787776",
                letterSpacing: "-0.36px",
                lineHeight: "13.2px",
                margin: 0,
              }}
            >
              v 1.1
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p
              style={{
                fontFamily: "Inter",
                fontWeight: 600,
                fontSize: 17,
                color: "#484646",
                letterSpacing: "-0.51px",
                lineHeight: "17.85px",
                margin: 0,
              }}
            >
              Description
            </p>
            <div
              style={{
                background: "#d9d9d9",
                borderRadius: 12,
                padding: "0 20px",
                height: 36,
                display: "flex",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                value={simulationDescription}
                onChange={(event) =>
                  setSimulationDescription(event.target.value.slice(0, 30))
                }
                placeholder="Please enter a description."
                style={{
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: 19.5,
                  color: "#787776",
                  letterSpacing: "-0.585px",
                  background: "none",
                  border: "none",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 180,
              height: 48,
              borderRadius: 36,
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 17,
              color: "#231f52",
              letterSpacing: "-0.51px",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
              backdropFilter: "blur(8px)",
            }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onSave(simulationName, simulationDescription)}
            style={{
              width: 180,
              height: 48,
              borderRadius: 36,
              border: "none",
              cursor: "pointer",
              fontFamily: "Inter",
              fontWeight: 600,
              fontSize: 17,
              color: "#ffffff",
              letterSpacing: "-0.51px",
              background: "#231f52",
              boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
