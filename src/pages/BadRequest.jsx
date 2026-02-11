import ErrorPage from "../components/common/ErrorPage";

export default function BadRequest() {
  return <ErrorPage errorCode="400" />;
}
