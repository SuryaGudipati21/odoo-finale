// src/App.jsx
// Owner: Shared — route definitions, wires pages together
import QuotationBuilder from "./pages/QuotationBuilder";
// import LoginPage from "./pages/LoginPage";
// import ApprovalScreen from "./pages/ApprovalScreen";

function App() {
  return (
    <div>
      <QuotationBuilder />
      {/* <LoginPage onLoginSuccess={() => console.log("Login succeeded")} /> */}
      {/* <ApprovalScreen /> */}
    </div>
  );
}

export default App;