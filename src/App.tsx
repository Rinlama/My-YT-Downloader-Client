import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  ControlGroup,
  Elevation,
  FormGroup,
  InputGroup,
  Label,
  Spinner,
} from "@blueprintjs/core";
import "./App.css";
import axios from "axios";

interface StreamState {
  data: any | null;
  error: Error | null;
  filename: string | null;
}

function App() {
  const [alert, setAlert] = useState({ isError: false, message: "" });
  const [loader, setLoader] = useState(false);
  const [info, setInfo] = useState<any>();
  const [url, setURL] = useState<any>("");

  const [streamState, setStreamState] = useState<StreamState>({
    data: 0,
    error: null,
    filename: "",
  });

  let server_url = "https://myytdownloader.azurewebsites.net";

  let ref = useRef<any>();

  useEffect(() => {
    ref.current = new AbortController();
    return () => ref.current.abort();
  }, []);

  const getInfo = async () => {
    try {
      setLoader(true);
      const { data } = await axios.get(`${server_url}/info?url=${url}`);
      setLoader(false);
      setInfo(data);
      convert(data);
    } catch (error: any) {
      setLoader(false);
      setAlert({
        isError: true,
        message: JSON.stringify(error.message),
      });
    }
  };

  const convert = async (data: any) => {
    setLoader(true);

    try {
      const resp = await fetch(
        `${server_url}/getmp3?url=${url}&title=${data.title}`,
        {
          signal: ref.current?.signal,
        }
      );
      if (!resp.ok || !resp.body) {
        throw resp.statusText;
      }

      const reader = resp.body.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        var decodeStreamValue = new TextDecoder().decode(value);
        const streamObj = JSON.parse(decodeStreamValue);
        setStreamState((prevState) => ({
          ...prevState,
          ...{ data: streamObj.progress },
          filename: streamObj.filename,
        }));
      }

      // console.log(res);
      setLoader(false);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStreamState((prevState) => ({ ...prevState, ...{ error: err } }));
      }

      setLoader(false);
    }
  };

  const download = async () => {
    if (!streamState.filename) return false;
    window.open(`${server_url}/download?filename=${streamState.filename}`);
  };

  return (
    <React.Fragment>
      <div className="body">
        <Alert
          confirmButtonText="Okay"
          isOpen={alert.isError}
          loading={false}
          onClose={() => {
            setAlert({
              ...alert,
              isError: false,
            });
          }}
        >
          <p>{alert.message}</p>
        </Alert>

        <div className="box">
          <div className="converter">
            <div className="header">
              <Card interactive={true}>
                <p>My .mp3 Downloader</p>
              </Card>
            </div>
            <Card interactive={true} elevation={Elevation.TWO}>
              <FormGroup
                helperText="Youtube URL"
                label="Youtube URL"
                labelFor="text-input"
                labelInfo="(required)"
              >
                <InputGroup
                  id="text-input"
                  placeholder="Add URL"
                  value={url}
                  onChange={(e) => {
                    const value = e.target.value;
                    setURL(value);
                  }}
                />
              </FormGroup>
              {info ? (
                <div className="detail">
                  <div className="preview">
                    <img
                      className="thumbnail"
                      src={info.thumbnails[0].url}
                      alt=""
                    />
                  </div>
                  <div className="more-info">
                    <p>Title :{info.title}</p>
                  </div>
                </div>
              ) : (
                ""
              )}
              <div className="label-spinner">
                <p>{Math.round(streamState.data * 100) / 100 + "%"}</p>
                {loader ? <Spinner intent={"primary"} size={20} /> : ""}
              </div>

              <div className="progress">
                <div className="bp4-progress-bar bp4-intent-primary">
                  <div
                    className="bp4-progress-meter"
                    style={{
                      width: Math.round(streamState.data * 100) / 100 + "%",
                    }}
                  ></div>
                </div>
              </div>
              <Button
                intent="primary"
                disabled={!url || loader}
                onClick={() => {
                  getInfo();
                }}
              >
                Convert
              </Button>
              <Button
                className="mx-2"
                disabled={!url || loader}
                intent="danger"
                onClick={() => {
                  ref.current?.abort();
                  setInfo(null);
                  setURL("");
                  setStreamState({ data: 0, error: null, filename: "" });
                }}
              >
                Stop
              </Button>
            </Card>
          </div>

          <Card interactive={true} elevation={Elevation.TWO}>
            <Button
              onClick={() => {
                download();
                setInfo(null);
                setURL("");
                setStreamState({ data: 0, error: null, filename: "" });
              }}
              disabled={streamState.data != 100}
              intent="danger"
              text="Download"
              fill={true}
            />
          </Card>
        </div>
      </div>
    </React.Fragment>
  );
}

export default App;
