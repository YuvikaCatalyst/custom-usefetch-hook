import useFetch from "./hooks/useFetch";

const App = () => {
  const { data, error, loading, refetch } = useFetch({
    url: "posts/1",
    transformer: (data) => ({
      ...data,
      title: data.title.toUpperCase(), 
    }),
    onSuccess: (res) => console.log("Success:", res),
    onError: (err) => console.error(" Error:", err),
    retryOnFailCount: 2,
    retryOnFailInterval: 2000,
    pollInterval: 10000, 
  });

  return (
    <div>
      <h1> Hook Test</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}> Error: {error}</p>}
      {data && !loading && (
        <div>
          <h2>{data.title}</h2>
          <p>{data.body}</p>
        </div>
      )}

      <button
        onClick={refetch}
      >
        Refetch
      </button>
    </div>
  );
};

export default App;
