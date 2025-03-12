import { Flex, Layout } from "antd";
import { LoadingProvider } from "../../store/context/loading-context";
import { AxiosInterceptor } from "./AxiosInterceptor";
import Headerecommerce from "./Headershipping";

const { Content } = Layout;

function Main({ }) {
  return (
    <Flex gap="middle" wrap>
      <Layout>
        <LoadingProvider>
          <AxiosInterceptor>
            <Headerecommerce /><br></br>
            <Content></Content>
          </AxiosInterceptor>
        </LoadingProvider>
      </Layout>
    </Flex>
  );
}

export default Main;
