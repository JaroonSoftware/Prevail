import { LoadingProvider } from "../../store/context/loading-context";
import { AxiosInterceptor } from "./AxiosInterceptor";
import PortalLayout from "../../pages/home/PortalLayout";

export default function Main({ children }) {
  return (
    <LoadingProvider>
      <AxiosInterceptor>
        <PortalLayout>{children}</PortalLayout>
      </AxiosInterceptor>
    </LoadingProvider>
  );
}
