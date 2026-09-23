package main

import (
	"context"
	"crypto/sha256"
	"embed"
	"encoding/hex"
	"errors"
	"flag"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"runtime"
	"syscall"
	"time"
)

//go:embed public
var gameFiles embed.FS

func main() {
	port := flag.Int("port", 4173, "puerto HTTP (0 elige uno libre)")
	local := flag.Bool("local", false, "solo permitir conexiones desde este equipo")
	noOpen := flag.Bool("no-open", false, "no abrir el navegador automaticamente")
	flag.Parse()

	if *port < 0 || *port > 65535 {
		log.Fatal("el puerto debe estar entre 0 y 65535")
	}

	assets, err := fs.Sub(gameFiles, "public")
	if err != nil {
		log.Fatalf("no se encuentran los recursos del juego: %v", err)
	}
	version, err := assetVersion(assets)
	if err != nil {
		log.Fatalf("no se pudo verificar el contenido del juego: %v", err)
	}

	host := "0.0.0.0"
	if *local {
		host = "127.0.0.1"
	}
	listener, err := listen(host, *port)
	if err != nil {
		log.Fatalf("no se pudo iniciar el servidor: %v", err)
	}
	defer listener.Close()

	actualPort := listener.Addr().(*net.TCPAddr).Port
	localURL := fmt.Sprintf("http://127.0.0.1:%d/", actualPort)
	server := &http.Server{
		Handler:           gameHandler(assets, version),
		ReadHeaderTimeout: 5 * time.Second,
	}

	fmt.Printf("Yokai Inspector\n\nEn este equipo: %s\n", localURL)
	if !*local {
		for _, ip := range lanAddresses() {
			fmt.Printf("En la red local: http://%s:%d/\n", ip, actualPort)
		}
		fmt.Println("Si otro dispositivo no conecta, permite el puerto en el firewall de la red privada.")
	}
	fmt.Println("Pulsa Ctrl+C para cerrar el servidor.")

	serverDone := make(chan error, 1)
	go func() { serverDone <- server.Serve(listener) }()
	if !*noOpen {
		if err := openBrowser(localURL); err != nil {
			fmt.Printf("No se pudo abrir el navegador automaticamente: %v\n", err)
		}
	}
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	defer signal.Stop(stop)

	select {
	case err := <-serverDone:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("error del servidor: %v", err)
		}
	case <-stop:
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("error al cerrar el servidor: %v", err)
		}
	}
}

func assetVersion(assets fs.FS) (string, error) {
	hash := sha256.New()
	err := fs.WalkDir(assets, ".", func(name string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil || entry.IsDir() {
			return walkErr
		}
		content, err := fs.ReadFile(assets, name)
		if err != nil {
			return err
		}
		hash.Write([]byte(name))
		hash.Write([]byte{0})
		hash.Write(content)
		return nil
	})
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(hash.Sum(nil)[:12]), nil
}

func gameHandler(assets fs.FS, version string) http.Handler {
	prefix := "/game-" + version + "/"
	files := http.FileServer(http.FS(assets))
	mux := http.NewServeMux()
	mux.Handle(prefix, http.StripPrefix(prefix, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		files.ServeHTTP(w, r)
	})))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		http.Redirect(w, r, prefix, http.StatusFound)
	})
	return mux
}

func listen(host string, requestedPort int) (net.Listener, error) {
	if requestedPort != 4173 {
		return net.Listen("tcp4", fmt.Sprintf("%s:%d", host, requestedPort))
	}
	for port := 4173; port <= 4182; port++ {
		listener, err := net.Listen("tcp4", fmt.Sprintf("%s:%d", host, port))
		if err == nil {
			return listener, nil
		}
		if !errors.Is(err, syscall.EADDRINUSE) {
			return nil, err
		}
	}
	return nil, errors.New("los puertos 4173 a 4182 estan ocupados; usa --port para elegir otro")
}

func lanAddresses() []string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil
	}
	var addresses []string
	seen := make(map[string]bool)
	for _, networkInterface := range interfaces {
		if networkInterface.Flags&net.FlagUp == 0 || networkInterface.Flags&net.FlagLoopback != 0 {
			continue
		}
		interfaceAddresses, err := networkInterface.Addrs()
		if err != nil {
			continue
		}
		for _, address := range interfaceAddresses {
			ip, _, err := net.ParseCIDR(address.String())
			if err != nil || ip.To4() == nil || !ip.IsPrivate() {
				continue
			}
			value := ip.String()
			if !seen[value] {
				addresses = append(addresses, value)
				seen[value] = true
			}
		}
	}
	return addresses
}

func openBrowser(url string) error {
	var command *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		command = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		command = exec.Command("open", url)
	default:
		command = exec.Command("xdg-open", url)
	}
	if err := command.Start(); err != nil {
		return err
	}
	return command.Process.Release()
}
