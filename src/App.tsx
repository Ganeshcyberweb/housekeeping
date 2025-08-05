import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContextProvider";
import AppContent from "./components/AppContent";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
