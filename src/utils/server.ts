import { createServer } from 'miragejs';
const { NEXT_PUBLIC_BASE_URL } = process.env;

export function makeServerEmployee(): void {
  createServer({
    urlPrefix: NEXT_PUBLIC_BASE_URL,
    routes() {
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

      this.put('employees', (_, request) => {
        const attrs = JSON.parse(request.requestBody);
        console.log('Mocking', attrs);

        return {
          status_code: 201,
          message: 'Data berhasil ditambahkan',
        };
      });

      this.get('employees/:id', (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        console.log('Mocking', attrs);
        const { id } = request.params;

        return {
          status_code: 200,
          message: 'Data berhasil ditampilkan',
          data: {
            id,
            firstName: 'Muhammad',
            lastName: 'Iskandar',
            birthday: '2002-06-25T08:36:51.775Z',
            position: 'Management Gudang',
            gender: 'male',
            email: 'adjiem31@gmail.com',
            handphoneNumber: '089614292529',
            address: 'Pondok Cibaligo',
          },
        };
      });

      this.passthrough();
      this.urlPrefix = ''; // or this.namespace = "/"
      this.passthrough(); // now this will pass through everything not handled to the current domain (e.g. localhost:3000)
    },
  });
}

export function makeServerAuth(): void {
  createServer({
    urlPrefix: NEXT_PUBLIC_BASE_URL,
    routes() {
      this.passthrough('/_next/static/development/_devPagesManifest.json');
      this.post('auth/login', (schema, request) => {
        const attrs = JSON.parse(request.requestBody);
        if (attrs.email === 'super_admin' && attrs.password === 'SuperAdmin') {
          return {
            data: {
              user: {},
              access_token: 'random-token',
            },
          };
        }

        return {};
      });

      this.passthrough();
      this.urlPrefix = '';
      this.passthrough();
    },
  });
}
