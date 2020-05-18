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
import CssBaseline from "@material-ui/core/CssBaseline";
import Box from "@material-ui/core/Box";
import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import DateFnsUtils from "@date-io/date-fns";
import { useQuery } from "react-query";
import { readItem, createItem } from "./api";
import {
  differenceInMilliseconds,
  fromUnixTime,
  getUnixTime,
  isPast,
} from "date-fns";
import TextField from "@material-ui/core/TextField";
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

  const milliseconds = Math.floor((millisRemaining % 1000) / 10);
  const seconds = Math.floor(millisRemaining / 1000) % 60;
  const minutes = Math.floor(millisRemaining / 60000) % 60;
  const hours = Math.floor(millisRemaining / 3600000);

  return (
    <Box textAlign="center">
      <Typography
        variant="h2"
        component="h2"
        style={{ opacity: visible ? "1" : "0.75" }}
        gutterBottom
      >
        {leftPad(hours)}:{leftPad(minutes)}:{leftPad(seconds)}.
        {leftPad(milliseconds)}
      </Typography>
    </Box>
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

      <Box textAlign="center">
        <Typography variant="h5" component="p" gutterBottom>
          {text}
        </Typography>
      </Box>
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
      <form onSubmit={onSubmit} className="form">
        <TextField
          id="outlined-textarea"
          label="Leave a message!"
          margin="normal"
          placeholder="Leave a message!"
          multiline
          variant="outlined"
          fullWidth
          rows={7}
          onChange={(e) => {
            setText(e.target.value);
          }}
          autoFocus
          value={text}
        />
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <DateTimePicker
            required
            disabled={loading}
            fullWidth
            label="Available After"
            openTo="hours"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </MuiPickersUtilsProvider>
        <Button
          margin="normal"
          disabled={loading}
          fullWidth
          variant="contained"
          color="primary"
          size="large"
          type="submit"
          className="submit"
        >
          Submit
        </Button>
      </form>

      <Backdrop open={loading}>
        <CircularProgress />
      </Backdrop>
    </div>
  );
}

function App() {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="sm">
        <Router>
          <Typography variant="h4" component="h1" gutterBottom>
            <Box textAlign="center">
              <Link to="/" className="title-link">
                <span role="img" aria-label="bomb">
                  💣
                </span>{" "}
                timebomb
              </Link>
            </Box>
          </Typography>
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
      </Container>
    </>
  );
}

export default App;
