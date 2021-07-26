const fs = require('fs');
// READ FILES
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf-8')
);
// Users route
exports.getAllUsers = (req, res) => {
  res
    .status(200)
    .json({ status: 'success', results: users.length, data: { users } });
};

const getNewUserId = () => {
  const lastUserId = users[users.length - 1]._id;
  const newThreeLastDigits = parseInt(lastUserId.slice(-3)) + 1;
  return lastUserId.slice(0, lastUserId.length - 3).concat(newThreeLastDigits);
};

exports.checkId = (req, res, next, val) => {
  const user = users.find((user) => user._id === val);
  if (!user) {
    return res.status(404).json({ status: 'fail', message: 'Invalid ID' });
  }
  next();
};

exports.getUser = (req, res) => {
  const user = users.find((user) => user._id === req.params.id);
  res.status(200).json({ status: 'success', data: { user } });
};
exports.createUser = (req, res) => {
  const newId = getNewUserId();
  const newUser = Object.assign({ _id: newId }, req.body);
  users.push(newUser);
  fs.writeFile(
    `${__dirname}/dev-data/data/users.json`,
    JSON.stringify(users),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: {
          user: newUser,
        },
      });
    }
  );
};
exports.updateUser = (req, res) => {
  const user = users.find((user) => user._id === req.params.id);
  const updatedUser = Object.assign({ _id: user._id }, req.body);
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
};
exports.deleteUser = (req, res) => {
  res.status(204).json({ status: 'success', data: null });
};
