import { cn } from "shadcn-lib/dist/lib/utils";
import { Button } from "shadcn-lib/dist/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Input } from "shadcn-lib/dist/components/ui/input";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "shadcn-lib/dist/components/ui/field";
import { Label } from "shadcn-lib/dist/components/ui/label";
import { useLoginWithEmail, useLoginWithGoogle, useSignupWithEmail } from "@/hooks/authHooks";
import { useState } from "react";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export const LoginOrSignupForm = ({ className, ...props }: React.ComponentProps<"div">) => {
  const [existingAccount, setExistingAccount] = useState(true);
  const { mutate: login } = useLoginWithGoogle();

  const handleSignInWithGoogle = async () => {
    login();
  };
  return (
    <div className='flex min-h-svh flex-col items-center justify-center bg-muted gap-6 p-6 md:p-10'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader className='text-center'>
              <CardTitle className='text-xl'>Projects by Ajay</CardTitle>
              <CardDescription>
                {`${existingAccount ? "Login" : "Signup"} with your Google account`}
              </CardDescription>
              <div className='flex flex-col gap-4'>
                <Button variant='outline' className='w-full' onClick={handleSignInWithGoogle}>
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                    <path
                      d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                      fill='currentColor'
                    />
                  </svg>
                  {`${existingAccount ? "Login" : "Signup"} with Google`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {existingAccount ? (
                <LoginForm setExistingAccount={setExistingAccount} />
              ) : (
                <SignupForm setExistingAccount={setExistingAccount} />
              )}
            </CardContent>
          </Card>
          {/* <div className='text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4'>
            By clicking continue, you agree to our <a href='#'>Terms of Service</a> and{" "}
            <a href='#'>Privacy Policy</a>.
          </div> */}
        </div>
      </div>
    </div>
  );
};

const LoginForm = ({ setExistingAccount }) => {
  const { mutate: loginWithEmail, isPending } = useLoginWithEmail();

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const email = form.get("email");
    const password = form.get("password");

    loginWithEmail({ email: email as string, password: password as string });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='grid gap-6'>
        <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
          <span className='bg-card text-muted-foreground relative z-10 px-2'>Or login with</span>
        </div>

        <FieldGroup className='grid gap-6'>
          <Field className='grid gap-3'>
            <FieldLabel htmlFor='email'>Email</FieldLabel>
            <Input id='email' name='email' type='email' placeholder='x@email.com' required />
          </Field>

          <Field className='grid gap-3'>
            <FieldLabel className='flex items-center' htmlFor='password'>
              Password
            </FieldLabel>
            <Input id='password' name='password' type='password' required />
          </Field>

          <Button disabled={isPending} type='submit' className='w-full'>
            {isPending ? "Logging in..." : "Login"}
          </Button>
        </FieldGroup>

        <FieldDescription className='text-center'>
          Don&apos;t have an account?{" "}
          <a
            // href=''
            className='underline underline-offset-4'
            onClick={() => setExistingAccount(false)}
          >
            Sign up
          </a>
        </FieldDescription>
      </div>
    </form>
  );
};

const SignupForm = ({ setExistingAccount }) => {
  const { mutate: signupWithEmail, isPending } = useSignupWithEmail();

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirm-password") as string;

    if (password.length < 8) {
      Toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      Toast.error("Passwords do not match.");
      return;
    }

    signupWithEmail({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className='after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t'>
        <span className='bg-card text-muted-foreground relative z-10 px-2'>
          Or create your account with
        </span>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='email'>Email</FieldLabel>
          <Input id='email' name='email' type='email' required />
        </Field>

        <Field>
          <div className='grid grid-cols-2 gap-4'>
            <Field>
              <FieldLabel htmlFor='password'>Password</FieldLabel>
              <Input id='password' name='password' type='password' required />
            </Field>

            <Field>
              <FieldLabel htmlFor='confirm-password'>Confirm Password</FieldLabel>
              <Input id='confirm-password' name='confirm-password' type='password' required />
            </Field>
          </div>
          <FieldDescription>Must be at least 8 characters long.</FieldDescription>
        </Field>

        <Field>
          <Button type='submit' disabled={isPending}>
            {isPending ? "Creating..." : "Create Account"}
          </Button>
        </Field>

        <FieldDescription className='text-center'>
          Already have an account?{" "}
          <a
            // href='#'
            onClick={() => setExistingAccount(true)}
          >
            Sign in
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
};
