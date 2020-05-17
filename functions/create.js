const faunadb = require("faunadb");
const shortid = require("shortid");

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

exports.handler = async (event, context) => {
  const data = JSON.parse(event.body);

  const text = data.text;
  if (typeof text !== "string") {
    return {
      statusCode: 400,
      body: JSON.stringify("invalid text"),
    };
  }

  const availableAfter = data.availableAfter;
  if (!Number.isInteger(availableAfter)) {
    return {
      statusCode: 400,
      body: JSON.stringify("invalid availableAfter"),
    };
  }

  const item = {
    data: {
      id: shortid.generate(),
      text,
      availableAfter,
    },
  };

  return client
    .query(q.Create(q.Ref("classes/items"), item))
    .then((response) => {
      console.log("success", response);
      return {
        statusCode: 200,
        body: JSON.stringify(response),
      };
    })
    .catch((error) => {
      console.log("error", error);
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      };
    });
};
