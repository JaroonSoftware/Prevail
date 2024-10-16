import { Flex, Layout } from "antd";
import { LoadingProvider } from "../../store/context/loading-context";
import { AxiosInterceptor } from "./AxiosInterceptor";
import Headerecommerce from "./Headershipping";

const { Content } = Layout;

function Main({ children }) {
  return (
    <Flex gap="middle" wrap>
      <Layout>
        <LoadingProvider>
          <AxiosInterceptor>
            <Headerecommerce/>
            <br></br>
            <Content>{children}</Content>
          </AxiosInterceptor>
        </LoadingProvider>
      </Layout>
    </Flex>
  );
}

export default Main;
