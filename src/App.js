import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useHistory,
  Redirect,
} from "react-router-dom";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import Button from "@material-ui/core/Button";
import DateFnsUtils from "@date-io/date-fns";
import { useQuery } from "react-query";
import { readItem, createItem } from "./api";
import {
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  isPast,
} from "date-fns";
import TextareaAutosize from "react-autosize-textarea";
import "./App.css";

function leftPad(int, { width = 2 } = {}) {
  return int.toString().padStart(width, 0);
}

function Clock({ millisRemaining }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible((visible) => !visible);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const milliseconds = millisRemaining % 1000;
  const seconds = Math.floor(millisRemaining / 1000) % 60;
  const minutes = Math.floor(millisRemaining / 60000) % 60;
  const hours = Math.floor(millisRemaining / 3600000);

  return (
    <div>
      <div className="countdown" style={{ opacity: visible ? "1" : "0.75" }}>
        {leftPad(hours)}:{leftPad(minutes)}:{leftPad(seconds)}:
        {leftPad(milliseconds, { width: 3 })}
      </div>
    </div>
  );
}

function Countdown({ target }) {
  const [millisRemaining, setMillisRemaining] = useState(
    differenceInMilliseconds(target, Date.now())
  );

  useEffect(() => {
    const id = setInterval(() => {
      setMillisRemaining(differenceInMilliseconds(target, Date.now()));
    }, 41);
    return () => clearInterval(id);
  }, [target]);

  return <Clock millisRemaining={Math.max(millisRemaining, 0)} />;
}

function Item() {
  const params = useParams();

  const { status, data, refetch } = useQuery(["items", params.id], readItem, {
    retry: false,
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (data) {
        const { pending, availableAfter } = data.data;
        if (pending && isPast(fromUnixTime(availableAfter))) {
          refetch({ force: true });
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [data, refetch]);

  if (status === "loading") {
    return null;
  }

  if (status === "error") {
    return <div>¯\_(ツ)_/¯</div>;
  }

  const { text, availableAfter } = data.data;

  return (
    <>
      <Countdown target={fromUnixTime(availableAfter)} />
      <div className="text">{text}</div>
    </>
  );
}

function Root() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [selectedDate, handleDateChange] = useState(new Date());
  const history = useHistory();

  const onSubmit = (e) => {
    e.preventDefault();

    setLoading(true);

    const data = {
      text,
      availableAfter: getUnixTime(selectedDate),
    };

    createItem(data).then((resp) => {
      history.push(`/i/${resp.data.id}`);
    });
  };

  return (
    <div>
      <form onSubmit={onSubmit}>
        <TextareaAutosize
          disabled={loading}
          className="textarea"
          placeholder="Leave a message!"
          onChange={(e) => {
            setText(e.target.value);
          }}
          value={text}
        />
        <div>
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DateTimePicker
              disabled={loading}
              label="DateTimePicker"
              className="datepicker"
              openTo="hours"
              value={selectedDate}
              onChange={handleDateChange}
            />
          </MuiPickersUtilsProvider>
          <Button
            disabled={loading}
            variant="contained"
            color="primary"
            size="large"
            type="submit"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <div className="page-wrapper">
      <div className="page-content">
        <Router>
          <h1 className="title">
            <Link to="/">
              <span role="img" aria-label="bomb">
                💣
              </span>{" "}
              timebomb
            </Link>
          </h1>
          <Switch>
            <Route path="/i/:id">
              <Item />
            </Route>
            <Route path="/" exact>
              <Root />
            </Route>
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </Router>
      </div>
    </div>
  );
}

export default App;
