import ErrorPage from "../components/common/ErrorPage";

export default function Forbidden() {
  return <ErrorPage errorCode="403" />;
}
