import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import React from 'react';

import { Button, ButtonWithModal } from '@/components/Button';
import { CardDashboard } from '@/components/Container';
import { ModalActionWrapper } from '@/components/Modal';
import Pagination from '@/components/Pagination';
import Table from '@/components/Table';
import { useCreateSalary } from '@/hooks/mutation/useMutateSalary';
import { useFetchPreviewSalary } from '@/hooks/query/useFetchPreviewSalary';
import useSalaryPreview from '@/hooks/table/useSalaryPreview';
import { formatDateYYYYMM } from '@/utils/format';

const PreviewPage = () => {
  const router = useRouter();
  return <CreateNewPayrollList date={new Date(router?.query?.date as string)} />;
};

const CreateNewPayrollList = ({ date }: { date: Date }) => {
  const { mutateAsync, isLoading: isMutating } = useCreateSalary();

  const [paginationUrl, setPaginationUrl] = React.useState('');
  const [pageSize, setPageSize] = React.useState(10);

  const { data: dataRes } = useFetchPreviewSalary({
    per_page: pageSize,
    where_payroll_month: formatDateYYYYMM(date),

    paginated: true,
    forceUrl: paginationUrl || undefined,
  });
  const {
    data: dataPreview = [],
    from,
    to,
    total,
    links,
    next_page_url,
    prev_page_url,
    last_page_url,
  } = dataRes?.data?.employees ?? {};
  const { columns, data } = useSalaryPreview(dataPreview);
  const router = useRouter();
  return (
    <>
      <CardDashboard>
        <div className="mt-2 mb-4 flex justify-between">
          <h2 className="text-2xl font-bold">Preview Gaji Bulanan Karyawan ({dayjs(date).format('MMM YYYY')})</h2>
          <ButtonWithModal text="Buat Daftar">
            {({ handleClose }) => {
              const handleClick = async () => {
                try {
                  await mutateAsync({
                    month: formatDateYYYYMM(date),
                  });
                  handleClose();
                  router.push(`/monthly-salary?date=${date.toISOString()}`);
                } catch (e) {
                  console.error(e);
                }
              };

              return (
                <>
                  <h2 className="text-xl font-bold mb-4">Konfirmasi</h2>
                  <ModalActionWrapper>
                    <Button variant="secondary" onClick={handleClose} className="mr-2">
                      Batalkan
                    </Button>
                    <Button onClick={handleClick} disabled={isMutating}>
                      Buat Daftar
                    </Button>
                  </ModalActionWrapper>
                </>
              );
            }}
          </ButtonWithModal>
        </div>

        <Table columns={columns} data={data} />
        <Pagination
          stats={{
            from: `${from ?? '0'}`,
            to: `${to ?? '0'}`,
            total: `${total ?? '0'}`,
          }}
          onClickGoToPage={(val) => {
            setPaginationUrl(`${(last_page_url as string).split('?')[0]}?page=${val}`);
          }}
          onChangePerPage={(page) => {
            setPaginationUrl('');
            setPageSize(page?.value ?? 0);
          }}
          onClickPageButton={(url) => {
            setPaginationUrl(url);
          }}
          links={links?.filter(({ label }: any) => !['&laquo; Previous', 'Next &raquo;'].includes(label)) ?? []}
          onClickNext={() => {
            setPaginationUrl((next_page_url as string) ?? '');
          }}
          onClickPrevious={() => {
            setPaginationUrl((prev_page_url as string) ?? '');
          }}
        />
      </CardDashboard>
    </>
  );
};

// <section className="h-96 flex items-center flex-col justify-center">
//   <h3 className="text-xl block mb-4">
//     Anda belum membuat daftar gaji yang harus dibayar bulan {dayjs(date).format('MMMM YYYY')}
//   </h3>

//   <ButtonWithModal text="Buat Daftar">
//     {({ handleClose }) => {
//       const handleClick = async () => {
//         try {
//           await mutateAsync({
//             month: formatDateYYYYMM(date),
//           });
//           handleClose();
//         } catch (e) {
//           console.error(e);
//         }
//       };

//       return (
//         <>
//           <h2 className="text-xl font-bold mb-4">Konfirmasi</h2>
//           <ModalActionWrapper>
//             <Button variant="secondary" onClick={handleClose} className="mr-2">
//               Batalkan
//             </Button>
//             <Button onClick={handleClick}>Buat Daftar</Button>
//           </ModalActionWrapper>
//         </>
//       );
//     }}
//   </ButtonWithModal>
// </section>

export default PreviewPage;
