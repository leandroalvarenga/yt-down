const { useState, useEffect } = React;

const IconePesquisa = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const Entrada = ({ ...props }) => (
  <input
    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
    {...props}
  />
);

const Botao = ({ children, ...props }) => (
  <button
    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 bg-yellow-400 text-black hover:bg-yellow-500 h-10 px-4 py-2 disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const Dialogo = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

const ConteudoDialogo = ({ children }) => (
  <div className="flex-grow overflow-auto p-6">{children}</div>
);
const CabecalhoDialogo = ({ children }) => (
  <div className="p-6 pb-0">{children}</div>
);
const TituloDialogo = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);
const RodapeDialogo = ({ children }) => (
  <div className="p-6 pt-0 flex justify-end">{children}</div>
);

const BarraProgresso = ({ progresso }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
    <div
      className="bg-yellow-400 h-2.5 rounded-full"
      style={{ width: `${progresso}%` }}
    ></div>
  </div>
);

const DownloadVideo = () => {
  const [url, setUrl] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [resultadosPesquisa, setResultadosPesquisa] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [progressoDownload, setProgressoDownload] = useState({});
  const [processandoDownload, setProcessandoDownload] = useState({});

  const handlePesquisa = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      if (!resposta.ok) {
        throw new Error("Falha ao buscar informações do vídeo");
      }
      const dados = await resposta.json();
      setResultadosPesquisa(dados.streams);
      setModalAberto(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  const handleDownload = async (itag) => {
    try {
      setProcessandoDownload((prev) => ({ ...prev, [itag]: true }));
      setProgressoDownload((prev) => ({ ...prev, [itag]: 0 }));

      // Simula um pequeno atraso para mostrar a mensagem de processamento
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const resposta = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, itag }),
      });
      if (!resposta.ok) {
        throw new Error("Falha no download");
      }
      const leitor = resposta.body.getReader();
      const tamanhoConteudo = +resposta.headers.get("Content-Length");
      let tamanhoRecebido = 0;
      const pedacos = [];

      setProcessandoDownload((prev) => ({ ...prev, [itag]: false }));

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;
        pedacos.push(value);
        tamanhoRecebido += value.length;
        setProgressoDownload((prev) => ({
          ...prev,
          [itag]: Math.round((tamanhoRecebido / tamanhoConteudo) * 100),
        }));
      }

      const blob = new Blob(pedacos);
      const urlDownload = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = urlDownload;
      a.download = "video.mp4";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlDownload);
    } catch (err) {
      setErro(err.message);
    } finally {
      setProgressoDownload((prev) => ({ ...prev, [itag]: 0 }));
      setProcessandoDownload((prev) => ({ ...prev, [itag]: false }));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
        Download de Vídeos
      </h1>
      <div className="flex items-center space-x-2 mb-4">
        <Entrada
          type="text"
          placeholder="Cole a URL do vídeo aqui"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-grow"
        />
        <Botao onClick={handlePesquisa} disabled={carregando}>
          <IconePesquisa className="h-4 w-4 mr-2" />
          {carregando ? "Pesquisando..." : "Pesquisar"}
        </Botao>
      </div>
      {erro && <p className="text-red-500 mt-2">{erro}</p>}

      <Dialogo open={modalAberto} onOpenChange={setModalAberto}>
        <CabecalhoDialogo>
          <TituloDialogo>Opções de Download</TituloDialogo>
        </CabecalhoDialogo>
        <ConteudoDialogo>
          <div className="space-y-4">
            {resultadosPesquisa.map((resultado) => (
              <div key={resultado.itag} className="flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {resultado.resolution}
                    {resultado.fps && resultado.fps > 30
                      ? ` ${resultado.fps}fps`
                      : ""}
                    ({resultado.mime_type})
                    {!resultado.is_progressive && " (Apenas Vídeo)"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {resultado.filesize !== "N/A"
                      ? `${(resultado.filesize / (1024 * 1024)).toFixed(2)} MB`
                      : "Tamanho variável"}
                  </span>
                </div>
                {processandoDownload[resultado.itag] ? (
                  <p className="text-yellow-600 font-medium">
                    Aguarde! Estamos processando a sua solicitação...
                  </p>
                ) : progressoDownload[resultado.itag] > 0 ? (
                  <BarraProgresso
                    progresso={progressoDownload[resultado.itag]}
                  />
                ) : (
                  <Botao
                    onClick={() => handleDownload(resultado.itag)}
                    disabled={
                      progressoDownload[resultado.itag] > 0 ||
                      processandoDownload[resultado.itag]
                    }
                  >
                    {progressoDownload[resultado.itag] > 0
                      ? "Baixando..."
                      : "Baixar"}
                  </Botao>
                )}
              </div>
            ))}
          </div>
        </ConteudoDialogo>
        <RodapeDialogo>
          <Botao onClick={() => setModalAberto(false)}>Fechar</Botao>
        </RodapeDialogo>
      </Dialogo>
    </div>
  );
};

ReactDOM.render(<DownloadVideo />, document.getElementById("root"));
