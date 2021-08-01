import { createServer } from 'miragejs';
const { BASE_URL } = process.env;

export default function makeServer(): void {
  createServer({
    urlPrefix: BASE_URL,
    routes() {
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

        return {};
      });

      this.post('employees', (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        console.log('Mocking', attrs);
        return {
          status_code: 200,
          message: 'Data berhasil ditampilkan',
          data: {
            employees: {
              current_page: 1,
              data: [
                {
                  id: '0001',
                  firstName: 'Muhammad',
                  lastName: 'Iskandar',
                  position: 'Management Gudang',
                  hasDashboardAccount: true,
                },
                {
                  id: '0002',
                  firstName: 'Muklis',
                  lastName: 'Permana',
                  position: 'Management Gudang',
                  hasDashboardAccount: false,
                },
                {
                  id: '0003',
                  firstName: 'Arifin Ilham',
                  lastName: 'Putra Setia',
                  position: 'Staff',
                  hasDashboardAccount: false,
                },
              ],
              first_page_url: 'test.com/employees?page=1',
              from: 1,
              last_page: 2,
              last_page_url: 'test.com/employees?page=2',
              next_page_url: 'test.com/employees?page=2',
              path: 'test.com/employees',
              per_page: 10,
              prev_page_url: null,
              to: 10,
              total: 100, // total all employee
            },
          },
        };
      });

      this.passthrough();
    },
  });
}
