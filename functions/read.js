const faunadb = require("faunadb");
const isFuture = require("date-fns/isFuture");
const fromUnixTime = require("date-fns/fromUnixTime");
const isValid = require("date-fns/isValid");

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET,
});

exports.handler = async (event, context) => {
  const { id } = event.queryStringParameters;

  return client
    .query(q.Paginate(q.Match(q.Index("items_by_id"), id)))
    .then((response) => {
      if (response.data.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "item not found" }),
        };
      }
      return client.query(q.Get(response.data[0])).then((response) => {
        const availableAfter = response.data.availableAfter;
        const date = fromUnixTime(availableAfter);
        console.log({
          availableAfter,
          isFuture: isFuture(date),
        });
        if (!isValid(date) || isFuture(date)) {
          return {
            statusCode: 200,
            body: JSON.stringify({
              ...response,
              data: {
                ...response.data,
                text: null,
                pending: true,
              },
            }),
          };
        } else {
          return {
            statusCode: 200,
            body: JSON.stringify({
              ...response,
              data: {
                ...response.data,
                pending: false,
              },
            }),
          };
        }
      });
    })
    .catch((error) => {
      console.log("error", error);
      return {
        statusCode: 400,
        body: JSON.stringify(error),
      };
    });
};
