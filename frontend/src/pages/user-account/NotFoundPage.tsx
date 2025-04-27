import PageTransition from "../../styles/PageTransition";

const NotFound = () => {
  console.log("");
  return (
    <PageTransition>
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red", fontSize: "20px" }}>Page Not Found</p>
        <p>Loading...</p>
      </div>
    </PageTransition>
  );
};

export default NotFound;
