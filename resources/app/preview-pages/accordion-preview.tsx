import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const AccordionPreview = () => {
  return (
    <div style={{ marginLeft: '400px' }}>
      <Accordion type="multiple" defaultValue={['product-information']}>
        <AccordionItem value="product-information">
          <AccordionTrigger>Product Information</AccordionTrigger>
          <AccordionContent>
            Our flagship product combines cutting-edge technology with sleek
            design. Built with premium materials, it offers unparalleled
            performance and reliability.
            <br />
            <br />
            Key features include advanced processing capabilities, and an
            intuitive user interface designed for both beginners and experts.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="shipping-details">
          <AccordionTrigger>Shipping Details</AccordionTrigger>
          <AccordionContent>
            We offer worldwide shipping through trusted courier partners.
            Standard delivery takes 3-5 business days, while express shipping
            ensures delivery within 1-2 business days.
            <br />
            <br />
            All orders are carefully packaged and fully insured. Track your
            shipment in real-time through our dedicated tracking portal.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="return-policy">
          <AccordionTrigger>Return Policy</AccordionTrigger>
          <AccordionContent>
            We stand behind our products with a comprehensive 30-day return
            policy. If you&apos;re not completely satisfied, simply return the
            item in its original condition.
            <br />
            <br />
            Our hassle-free return process includes free return shipping and
            full refunds processed within 48 hours of receiving the returned
            item.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

AccordionPreview.displayName = 'AccordionPreview';

export default AccordionPreview;
