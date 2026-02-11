import ErrorPage from "../components/common/ErrorPage";

export default function ServiceUnavailable() {
  return <ErrorPage errorCode="503" />;
}
