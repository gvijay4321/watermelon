import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export default function Test({}) {
  const [access_token, setAT] = useState(null);
  const [cloudId, setCI] = useState(null);
  const [project, setP] = useState(null);
  useEffect(() => {
    fetch("/api/jira/getToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: supabase.auth.user().id,
      }),
    })
      .then((res) => res.json())
      .then((resJson) => {
        setAT(resJson.access_token);
        setCI(resJson.cloudId);
      });
  }, []);

  return (
    <div>
      <p>{access_token}</p>
      <p>{cloudId}</p>
    </div>
  );
}
