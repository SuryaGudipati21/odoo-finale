// src/App.jsx
// Owner: Shared — route definitions, wires pages together
import LoginPage from "./pages/LoginPage";
// import ApprovalScreen from "./pages/ApprovalScreen";
// import QuotationBuilder from "./pages/QuotationBuilder";

function App() {
  return (
    <div>
      <LoginPage onLoginSuccess={() => console.log("Login succeeded")} />
      {/* <ApprovalScreen /> */}
      {/* <QuotationBuilder /> */}
    </div>
  );
}

export default App;