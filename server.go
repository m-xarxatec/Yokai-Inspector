package main

import (
	"context"
	"embed"
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
		Handler:           http.FileServer(http.FS(assets)),
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
