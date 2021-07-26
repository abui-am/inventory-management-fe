import { createServer } from 'miragejs';
const { BASE_URL } = process.env;

export default function makeServer(): void {
  createServer({
    urlPrefix: BASE_URL,
    routes() {
      this.passthrough('/_next/static/development/_devPagesManifest.json');
      this.post('auth/login', (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        if (attrs.email === 'super_admin' && attrs.password === 'SuperAdmin') {
          return {
            data: {
              user: {},
              token: 'random-token',
            },
          };
        }
      });
    },
  });
}
