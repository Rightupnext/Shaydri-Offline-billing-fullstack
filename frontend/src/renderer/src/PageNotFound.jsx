import React from "react";
import { useNavigate } from "react-router-dom";
import notfound from "./assets/404.png"; // adjust path if needed

const PageNotFound = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back one page in history
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px",
        marginTop:40
      }}
    >
      <img
        src={notfound}
        alt="404 Not Found"
        style={{ maxWidth: "400px", marginBottom: "20px" }}
      />
      <h1 style={{ fontSize: "48px", marginBottom: "10px", color:"black"}}>404</h1>
      <p style={{ fontSize: "18px", marginBottom: "30px",color:"black" }}>
        Sorry, the page you visited does not exist.
      </p>
      <button
        onClick={handleBack}
        style={{
          padding: "10px 50px",
          fontSize: "16px",
          backgroundColor:"black",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Go Back
      </button>
    </div>
  );
};

export default PageNotFound;
