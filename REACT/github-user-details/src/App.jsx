import React, { useState } from 'react';
import './App.css';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';

function App() {
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    setUsername(e.target.value);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (username) {
      try {
        setError(null); // Reset error before making new requests
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) {
          throw new Error('User not found');
        }
        const userData = await userResponse.json();
        setUser(userData);

        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
        if (!reposResponse.ok) {
          throw new Error('Repositories not found');
        }
        const reposData = await reposResponse.json();
        setRepos(reposData);
      } catch (error) {
        setError(error.message);
        setUser(null);
        setRepos([]);
      }
    }
  };

  const handleReset = () => {
    setUsername('');
    setUser(null);
    setRepos([]);
    setError(null);
  };

  return (
    <div className="App">
      {!user && !error ? (
        <UserForm
          username={username}
          onInputChange={handleInputChange}
          onFormSubmit={handleFormSubmit}
        />
      ) : (
        <>
          {error ? (
            <div className="user-details error">
              <p>{error}</p>
              <button onClick={handleReset}>Reset</button>
            </div>
          ) : (
            <UserDetails user={user} repos={repos} onReset={handleReset} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
