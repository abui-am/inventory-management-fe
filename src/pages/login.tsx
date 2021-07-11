import { Button, Checkbox, TextField } from '@/components/Form';

export default function Home(): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 as">
      <div className="max-w-md flex-col justify-center items-center -mt-16">
        <h1 className="text-4xl font-bold mb-10 text-center">
          Sign in ke <span className="text-blue-600">dashboard</span>
        </h1>
        <div className=" w-full text-center mb-10">
          <span className="text-blueGray-600">Silahkan mengisi form di bawah ini untuk masuk ke dalam dashboard</span>
        </div>
        <div className="max-w-md w-full p-8 shadow-2xl rounded-lg bg-white">
          <div className="mb-3">
            <label className="mb-1 inline-block">Username / Email</label>
            <TextField />
          </div>
          <div className="mb-3">
            <label className="mb-1 inline-block">Password</label>
            <TextField type="password" />
          </div>
          <div className="flex mb-4 justify-between">
            <Checkbox>Remember me</Checkbox>
            <a>Lupa password</a>
          </div>
          <div>
            <Button>Sign in</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
