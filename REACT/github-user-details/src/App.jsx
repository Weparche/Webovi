import React, { useState } from 'react';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);

  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const fetchUserData = async () => {
    try {
      const userResponse = await fetch(`https://api.github.com/users/${username}`);
      const userData = await userResponse.json();
      
      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
      const reposData = await reposResponse.json();

      setUser(userData);
      setRepos(reposData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    fetchUserData();
  };

  const handleReset = () => {
    setUsername('');
    setUser(null);
    setRepos([]);
  };

  return (
    <div className="App">
      <UserForm
        username={username}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
      />
      {user && (
        <UserDetails
          user={user}
          repos={repos}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

export default App;