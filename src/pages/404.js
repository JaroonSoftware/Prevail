import { React } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
const PageNotFound = () => {
const GxContent = styled.div`
  padding: 32px 32px 0;
  flex: 1;
`;

const GxTextCode = styled.div`
  color: #595959;
  font-size: 160px;
  text-align: center;
  line-height: 1;
  font-weight: 500;
  text-shadow: 10px 6px 8px rgba(117, 117, 117, 0.8);
`;

  return (
    <>
      <GxContent>
        <GxTextCode>404</GxTextCode>
        <h2 className="text-center">
          Oops, an error has occurred. Page not found!
        </h2>
        <p className="text-center">
          {/* <a className="btn btn-primary" href="/dashboard">Go to Home</a> */}
          <Link className="btn btn-primary" to="">
            Go to Home
          </Link>
        </p>
      </GxContent>
    </>
  );
};

export default PageNotFound;
