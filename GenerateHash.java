
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;

public class GenerateHash {
    public static void main(String[] args) {
        Pbkdf2PasswordEncoder encoder = new Pbkdf2PasswordEncoder();
        System.out.println(encoder.encode("admin123"));
    }
}
