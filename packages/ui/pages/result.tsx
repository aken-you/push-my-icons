import { Link, useLocation } from "react-router-dom";

export const Result = () => {
  const location = useLocation();
  const state = location.state;

  return (
    <div className="flex flex-col justify-center items-center space-y-4">
      <h1 className="text-xl font-semibold text-blue-600">🎉 Success 🎉</h1>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => {
            window.open(state.prUrl, "_blank");
          }}
          className="bg-blue-600 text-white py-2 rounded enabled:hover:bg-blue-700 px-3 cursor-pointer"
        >
          Go to Pull Request
        </button>

        <Link
          to="/"
          state={{
            token: state.token,
            repoUrl: state.repoUrl,
            folderPath: state.folderPath,
            prTitle: state.prTitle,
            prBody: state.prBody,
            includeChangedFilesSummary: state.includeChangedFilesSummary,
          }}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 px-3"
        >
          Back
        </Link>
      </div>
    </div>
  );
};
