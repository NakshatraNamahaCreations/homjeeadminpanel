import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, Button, Form } from "react-bootstrap";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaCheckCircle,
  FaQuestionCircle,
  FaBan,
} from "react-icons/fa";

/**
 * App-wide custom dialog system — replaces the browser's alert/confirm/prompt.
 *
 * Usage (inside any component rendered under <DialogProvider />):
 *
 *   const { confirm, prompt, notify } = useDialog();
 *
 *   const ok = await confirm({
 *     title: "Archive vendor?",
 *     message: "They will be logged out immediately.",
 *     variant: "danger",
 *     confirmLabel: "Archive",
 *   });
 *
 *   const value = await prompt({
 *     title: "Reason",
 *     message: "Optional: reason for archiving",
 *     placeholder: "e.g. repeated no-shows",
 *   });
 *   // value === null if user cancelled, else the entered string (may be "")
 *
 *   await notify({
 *     title: "Archived",
 *     message: "Vendor has been archived successfully.",
 *     variant: "success",
 *   });
 */

const DialogContext = createContext(null);

const ICONS = {
  danger: <FaBan size={28} style={{ color: "#dc3545" }} />,
  warning: <FaExclamationTriangle size={28} style={{ color: "#f0a30a" }} />,
  info: <FaInfoCircle size={28} style={{ color: "#0d6efd" }} />,
  success: <FaCheckCircle size={28} style={{ color: "#198754" }} />,
  question: <FaQuestionCircle size={28} style={{ color: "#0d6efd" }} />,
};

const VARIANT_BTN = {
  danger: "danger",
  warning: "warning",
  info: "primary",
  success: "success",
  question: "primary",
};

const DEFAULT_STATE = {
  open: false,
  type: "notify", // "notify" | "confirm" | "prompt"
  title: "",
  message: "",
  variant: "info",
  confirmLabel: "OK",
  cancelLabel: "Cancel",
  placeholder: "",
  defaultValue: "",
  inputType: "text", // "text" | "textarea"
  required: false,
};

export const DialogProvider = ({ children }) => {
  const [state, setState] = useState(DEFAULT_STATE);
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState("");
  const resolverRef = useRef(null);

  const close = useCallback((result) => {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setState(DEFAULT_STATE);
    setInputValue("");
    setInputError("");
    if (resolver) resolver(result);
  }, []);

  const openDialog = useCallback((type, opts = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setInputValue(opts.defaultValue ?? "");
      setInputError("");
      setState({
        ...DEFAULT_STATE,
        ...opts,
        type,
        open: true,
      });
    });
  }, []);

  const api = useMemo(
    () => ({
      confirm: (opts) => openDialog("confirm", opts),
      prompt: (opts) => openDialog("prompt", opts),
      notify: (opts) => openDialog("notify", opts),
    }),
    [openDialog],
  );

  const handleConfirm = () => {
    if (state.type === "prompt") {
      const trimmed = (inputValue || "").trim();
      if (state.required && !trimmed) {
        setInputError("This field is required.");
        return;
      }
      close(inputValue);
      return;
    }
    close(true);
  };

  const handleCancel = () => {
    if (state.type === "prompt") {
      close(null);
      return;
    }
    if (state.type === "confirm") {
      close(false);
      return;
    }
    close(true);
  };

  const icon = ICONS[state.variant] || ICONS.info;
  const confirmBtnVariant = VARIANT_BTN[state.variant] || "primary";

  return (
    <DialogContext.Provider value={api}>
      {children}

      <Modal
        show={state.open}
        onHide={handleCancel}
        centered
        backdrop="static"
        keyboard={state.type !== "notify"}
      >
        <Modal.Body className="p-4">
          <div className="d-flex gap-3 align-items-start">
            <div style={{ lineHeight: 0, flex: "0 0 auto" }}>{icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {state.title ? (
                <h5
                  className="fw-bold mb-2"
                  style={{ fontSize: 15, color: "#212529" }}
                >
                  {state.title}
                </h5>
              ) : null}

              {state.message ? (
                <div
                  className="text-muted"
                  style={{
                    fontSize: 13,
                    whiteSpace: "pre-line",
                    marginBottom: state.type === "prompt" ? 12 : 0,
                  }}
                >
                  {state.message}
                </div>
              ) : null}

              {state.type === "prompt" && (
                <Form.Group>
                  <Form.Control
                    autoFocus
                    as={state.inputType === "textarea" ? "textarea" : "input"}
                    type={state.inputType === "textarea" ? undefined : "text"}
                    rows={state.inputType === "textarea" ? 3 : undefined}
                    value={inputValue}
                    placeholder={state.placeholder}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError("");
                    }}
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
                        state.inputType !== "textarea"
                      ) {
                        e.preventDefault();
                        handleConfirm();
                      }
                    }}
                    isInvalid={!!inputError}
                    style={{ fontSize: 13 }}
                  />
                  {inputError ? (
                    <Form.Control.Feedback type="invalid">
                      {inputError}
                    </Form.Control.Feedback>
                  ) : null}
                </Form.Group>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          {state.type !== "notify" && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleCancel}
              style={{ fontSize: 12, borderRadius: 8, padding: "6px 14px" }}
            >
              {state.cancelLabel}
            </Button>
          )}
          <Button
            variant={confirmBtnVariant}
            size="sm"
            onClick={handleConfirm}
            style={{ fontSize: 12, borderRadius: 8, padding: "6px 14px" }}
          >
            {state.confirmLabel}
          </Button>
        </Modal.Footer>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used inside <DialogProvider />");
  }
  return ctx;
};

export default DialogProvider;
