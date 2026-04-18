import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { DialogProvider } from "./components/common/DialogContext";

function App() {
  return (
    <BrowserRouter>
      <DialogProvider>
        <AppRoutes />
      </DialogProvider>
    </BrowserRouter>
  );
}

export default App;
