import axios from "axios";
import { useEffect, useState } from "react";

const useFetch = (url, autoFetch = true, axiosOptions = {}, transformResponse, onSuccess, onError) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchResponse = async () => {
        setLoading(true);
        try {
            const response = await axios.get(url, axiosOptions);
            const result = transformResponse ? transformResponse(response.data) : response.data;
            setData(result);
            if(onSuccess){
                onSuccess(result);
            }
        } catch (e) {
            setError(e);
            if(onError){
               onError(e);
            }
        }
        finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (autoFetch) {
            fetchResponse();
        }
    }, [url]);

    return {
        data, error, loading,refetch:fetchResponse
    }
}

export default useFetch;