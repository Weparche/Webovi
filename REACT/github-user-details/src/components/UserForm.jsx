import React from 'react';
import PropTypes from 'prop-types';

const UserForm = ({ username, onInputChange, onFormSubmit }) => (
  <form onSubmit={onFormSubmit}>
    <input
      type="text"
      value={username}
      onChange={onInputChange}
      placeholder="Enter GitHub username"
    />
    <button type="submit">Submit</button>
  </form>
);

UserForm.propTypes = {
  username: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onFormSubmit: PropTypes.func.isRequired,
};

export default UserForm;