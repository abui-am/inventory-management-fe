import { useState } from 'react';

const TodoList = () => {
  const [count, setCount] = useState(0);
  return (
    <div>
      <input type="text" value={count} onChange={(e) => setCount(e.target.value)} />
      <Counter count={count} />
    </div>
  );
};

// Count merupakan props yang dikirimkan ke Counter
const Counter = ({ count }) => {
  return (
    <div
      style={{
        padding: '10px',
      }}
    >
      <p
        style={{
          color: 'red',
          fontSize: '20px',
        }}
      >
        {count}
      </p>
    </div>
  );
};

export default TodoList;
