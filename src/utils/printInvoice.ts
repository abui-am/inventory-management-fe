const printInvoice = async (file: string) => {
  const url = window.URL.createObjectURL(
    new Blob([file], {
      type: 'application/pdf',
    })
  );

  const iframe = document.createElement('iframe'); // load content in an iframe to print later
  document.body.appendChild(iframe);

  iframe.style.display = 'none';
  iframe.src = url;
  iframe.onload = function () {
    setTimeout(function () {
      iframe.focus();
      iframe.contentWindow?.print();
    }, 1);
  };
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.setAttribute('download', `invoice-${transactionId}.pdf`);
  //   document.body.appendChild(link);
  //   link.click();
};

export default printInvoice;
