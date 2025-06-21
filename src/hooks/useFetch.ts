import { useEffect, useState } from "react";
import api from "../services/api.service";

type usefetchArgs={
    url: string;
    autoFetch?: boolean;
    transformer?: (data: any) => any;
    onSuccess?: (data: any) => any;
    onError?: (error: any) => any;
}

const useFetch = ({url, autoFetch = true, transformer, onSuccess, onError}:usefetchArgs) => {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>("");
    const [loading, setLoading] = useState<boolean>(false);

    const fetchResponse = async () => {
        setLoading(true);
        try {
            const response = await api.get(url);
            const result = transformer ? transformer(response.data) : response.data;
            setData(result);
            if(onSuccess){
                onSuccess(result);
            }
        } catch (e:any) {
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