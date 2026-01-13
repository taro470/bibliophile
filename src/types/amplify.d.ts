// Type declarations for Amplify generated files

declare module '@/amplify_outputs.json' {
  const outputs: {
    auth?: {
      user_pool_id: string;
      user_pool_client_id: string;
      identity_pool_id?: string;
      aws_region: string;
    };
    data?: {
      url: string;
      aws_region: string;
      default_authorization_type: string;
      authorization_types?: string[];
    };
    version?: string;
  };
  export default outputs;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
